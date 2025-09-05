/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */

function clientScript(search) {

    function saveRecord(context) {

        var currentRecord = context.currentRecord;
        currentRecord.setValue({ fieldId: 'autoname', value: false });

        return true;
    }

    return {
        saveRecord: saveRecord,
        pageInit: function () { console.log("Initialized") }
    };
}

define(['N/search'], clientScript);
