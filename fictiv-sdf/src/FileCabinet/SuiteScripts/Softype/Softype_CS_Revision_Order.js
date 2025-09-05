/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/message'], function(currentRecord, message) {

    function pageInit(context) {
        const urlParams = new URLSearchParams(window.location.search);
        const newSoId = urlParams.get('custparam_newso');

        console.log('📌 URL:', window.location.href);
        console.log('📌 custparam_newso:', newSoId);

        if (newSoId) {
            const rec = currentRecord.get();

            const field = rec.getField({
                fieldId: 'custbody_st_revision_reason'
            });

            if (field) {
                field.isMandatory = true;

                message.create({
                    type: message.Type.WARNING,
                    title: 'Required Field',
                    message: 'Please select a Revision Reason before saving this revised Sales Order.'
                }).show({ duration: 5000 });
            }
        }
    }

    function saveRecord(context) {
        const urlParams = new URLSearchParams(window.location.search);
        const newSoId = urlParams.get('custparam_newso');
    
        if (newSoId) {
            const rec = currentRecord.get();
    
            const reason = rec.getValue({
                fieldId: 'custbody_st_revision_reason'
            });
    
            if (!reason) {
                alert('Revision Reason is required before saving this revised Sales Order.');
                return false; // ❌ Prevent save
            }
    
            // ✅ Schedule redirect to view mode after save
            const recordId = urlParams.get('id');
            setTimeout(() => {
                const redirectUrl = `/app/accounting/transactions/salesord.nl?id=${recordId}&custparam_newso=${newSoId}`;
                window.location.href = redirectUrl; // Will load in view mode
            }, 500);
        }
    
        return true; // ✅ Allow save to proceed
    }
    



    return {
        pageInit: pageInit,
        saveRecord:saveRecord
    };
});
