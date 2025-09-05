/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function (record, log) {
    function beforeLoad(context){
        log.debug("in bl")
    }
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT) {
            return;
        }

        try {
            var newRecord = context.newRecord;
            var newRecord = record.load({
                type: record.Type.INVENTORY_ITEM,
                id: context.newRecord.id,
                isDynamic: true
            });

            var lineCount = newRecord.getLineCount({ sublistId: 'itemvendor' });

            if (lineCount >= 1) {
                // Read first line
                var vendor = newRecord.getSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'vendor',
                    line: 0
                });

                var preferred = newRecord.getSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'preferredvendor',
                    line: 0
                });

                var purchasePrice = newRecord.getSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'vendorprices',
                    line: 0
                });

                var subsidiary = newRecord.getSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'subsidiary',
                    line: 0
                });

                var vendorCode = newRecord.getSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'vendorcode',
                    line: 0
                });

                // Add new line with same values
                newRecord.selectNewLine({ sublistId: 'itemvendor' });

                newRecord.setCurrentSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'vendor',
                    value: "5513"
                });

                newRecord.setCurrentSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'preferredvendor',
                    value: false
                });

                // newRecord.setCurrentSublistValue({
                //     sublistId: 'itemvendor',
                //     fieldId: 'vendorprices',
                //     value: purchasePrice
                // });

                // newRecord.setCurrentSublistValue({
                //     sublistId: 'itemvendor',
                //     fieldId: 'vendorprices',
                //     value: purchasePrice
                // });

                // if (vendorCode) {
                //     newRecord.setCurrentSublistValue({
                //         sublistId: 'itemvendor',
                //         fieldId: 'vendorcode',
                //         value: vendorCode
                //     });
                // }

                newRecord.setCurrentSublistValue({
                    sublistId: 'itemvendor',
                    fieldId: 'subsidiary',
                    value: "5"
                });

                newRecord.commitLine({ sublistId: 'itemvendor' });
                newRecord.save()

                log.debug('Vendor line duplicated', `Vendor ID: ${vendor}`);
            }

        } catch (e) {
            log.error('Error duplicating vendor line', e.message);
        }
    }

    return {
        beforeLoad:beforeLoad,
        afterSubmit: afterSubmit
    };
});
