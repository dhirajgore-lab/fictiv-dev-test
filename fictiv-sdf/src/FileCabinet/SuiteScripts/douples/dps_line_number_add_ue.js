/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record'],

    function (record) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            var rec = scriptContext.newRecord;
            var type = scriptContext.type;
            if(type == 'delete'){
            	return
            }
            var transaction_rec = record.load({ type: rec.type, id: rec.id })
            var line = transaction_rec.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < line; i++) {
                var line_no = transaction_rec.getSublistValue({ sublistId: 'item', fieldId: 'line', line: i });
                transaction_rec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_dps_line_no', value: line_no, line: i });
            }
            transaction_rec.save({ ignoreMandatoryFields: true });
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });
