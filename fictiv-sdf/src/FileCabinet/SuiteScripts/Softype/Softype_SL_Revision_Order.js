/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log', 'N/url'], function(record, log, url) {

    function onRequest(context) {
        var soId = context.request.parameters.soId;
        log.debug("SO ID", soId);

        // Step 1: Load the current SO
        var origSoUpdate = record.load({
            type: record.Type.SALES_ORDER,
            id: soId,
            isDynamic: false
        });

        // Step 2: Determine the original SO ID
        var existingOriginalId = origSoUpdate.getValue({ fieldId: 'custbody_st_original_order' });
        var trueOriginalId = existingOriginalId || soId;

        // Step 3: Copy SO to create the revision
        var newSo = record.copy({
            type: record.Type.SALES_ORDER,
            id: soId,
            isDynamic: true
        });
        // Remove all existing lines from the copy
        var lineCount = newSo.getLineCount({ sublistId: 'item' });
        for (var i = lineCount - 1; i >= 0; i--) {
            newSo.removeLine({ sublistId: 'item', line: i });
        }

        // Re-add each item from the original SO with just the quantity
        var originalLineCount = origSoUpdate.getLineCount({ sublistId: 'item' });
        for (var i = 0; i < originalLineCount; i++) {
            var itemId = origSoUpdate.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            var quantity = origSoUpdate.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
            var rate = origSoUpdate.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });

            newSo.selectNewLine({ sublistId: 'item' });
            newSo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemId }); // auto-sources other fields
            newSo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: quantity });
            newSo.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: rate });
            newSo.commitLine({ sublistId: 'item' });
        }


        newSo.setValue({ fieldId: 'custbody_st_revision_reason', value: '' });
        newSo.setValue({ fieldId: 'custbody_st_original_order', value: trueOriginalId });
        newSo.setValue({ fieldId: 'custbody_st_revised_order', value: '' });

        var newSoId = newSo.save();
        log.debug('New SO Created', newSoId);

        // Step 4: Update current SO's revised field
        origSoUpdate.setValue({ fieldId: 'custbody_st_original_order', value: trueOriginalId })
        origSoUpdate.setValue({ fieldId: 'custbody_st_revised_order', value: newSoId });
        origSoUpdate.save();

        // Step 5: Recursive function to process and close everything
        function closeLines(recObj, sublistId, label) {
            var count = recObj.getLineCount({ sublistId });
            for (var i = 0; i < count; i++) {
                recObj.selectLine({ sublistId, line: i });
                recObj.setCurrentSublistValue({ sublistId, fieldId: 'isclosed', value: true });
                recObj.commitLine({ sublistId });
            }
            recObj.save();
            log.audit(`${label} Closed`, `Record ID: ${recObj.id}`);
        }

        function processLinkedTransactions(recordType, recordId, processedMap = {}) {
            var key = recordType + '_' + recordId;
            if (processedMap[key]) return;
            processedMap[key] = true;

            try {
                var rec = record.load({ type: recordType, id: recordId, isDynamic: true });

                // Close lines if it's a SO or PO
                if (['salesorder', 'purchaseorder'].includes(recordType)) {
                    closeLines(rec, 'item', recordType.toUpperCase());
                }

                // Loop through all linked records
                var linkCount = rec.getLineCount({ sublistId: 'links' });
                for (var i = 0; i < linkCount; i++) {
                    var linkedType = rec.getSublistValue({ sublistId: 'links', fieldId: 'type', line: i });
                    var linkedId = rec.getSublistValue({ sublistId: 'links', fieldId: 'id', line: i });

                    if (!linkedType || !linkedId) continue;

                    switch (linkedType) {
                        case 'Purchase Order':
                            processLinkedTransactions('purchaseorder', linkedId, processedMap);
                            break;

                        case 'Sales Order':
                            processLinkedTransactions('salesorder', linkedId, processedMap);
                            break;

                        case 'Invoice':
                            log.audit('Invoice Found (No Action Taken)', `Invoice ID: ${linkedId}`);
                            // Optional: implement void logic
                            break;

                        case 'Item Fulfillment':
                            log.audit('Item Fulfillment Found (No Action Taken)', `IF ID: ${linkedId}`);
                            // Optional: implement void logic
                            break;

                        default:
                            log.debug('Unhandled Linked Type', `${linkedType} (ID: ${linkedId})`);
                    }
                }

                // Handle intercompany link (if present)
                if (recordType === 'purchaseorder') {
                    var icsoId = rec.getValue({ fieldId: 'intercotransaction' });
                    if (icsoId) processLinkedTransactions('salesorder', icsoId, processedMap);
                }

            } catch (e) {
                log.error(`Error processing ${recordType} ${recordId}`, e.message);
            }
        }

        // Step 6: Start recursive closure from original SO
        processLinkedTransactions('salesorder', soId);

        // Step 7: Redirect to original SO with new SO ID as param
        var redirectUrl = url.resolveRecord({
            recordType: record.Type.SALES_ORDER,
            recordId: soId,
            isEditMode: false
        });
        redirectUrl += '&custparam_newso=' + newSoId;

        context.response.write(`
            <html><body>
            <script>
                window.location.href = "${redirectUrl}";
            </script>
            </body></html>
        `);
    }

    return {
        onRequest: onRequest
    };
});
