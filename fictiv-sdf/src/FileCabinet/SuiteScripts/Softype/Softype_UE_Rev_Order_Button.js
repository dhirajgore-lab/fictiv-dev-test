/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/url', 'N/ui/message'], function (ui, url, message) {

    function beforeLoad(context) {
        const form = context.form;
        const rec = context.newRecord;
        const request = context.request;

        if (context.type === context.UserEventType.VIEW) {

            var status = rec.getValue({fieldId: "status"});
            log.debug("status",status)
            // Add Revision Order button
            const suiteletURL = url.resolveScript({
                scriptId: 'customscript_softype_sl_revision_order',
                deploymentId: 'customdeploy_softype_sl_revision_order',
                params: { soId: rec.id }
            });
            if(status.includes('Partially Fulfilled') || 
               status == 'Pending Fulfillment' ||
               status == 'Partially Fulfilled' ||
               status == 'Pending Billing' ||
               status == 'Closed'
            ){
                form.addButton({
                    id: 'custpage_revision_order',
                    label: 'Revise Order',
                    functionName: `window.open('${suiteletURL}', '_self')`
                });
            }

            // Show banner after redirect
            if (request?.parameters?.custparam_newso) {
                const newSoId = request.parameters.custparam_newso;
                form.addPageInitMessage({
                    type: message.Type.CONFIRMATION,
                    title: 'Revision Created',
                    message:
                        `✅ All related orders were closed.<br>` +
                        `🆕 New Sales Order created: ` +
                        `<a href="/app/accounting/transactions/salesord.nl?id=${newSoId}" target="_blank">#${newSoId}</a>`
                });
            }
        }

        // if (context.type === context.UserEventType.EDIT && request?.parameters?.custparam_newso) {
        //     // Attach Client Script (optional: for banner or highlight)
        //     form.clientScriptModulePath = 'SuiteScripts/Softype_CS_Revision_Order.js';
            
        //     // Also visually mark the field as mandatory
        //     const field = form.getField({
        //         id: 'custbody_st_revision_reason'
        //     });
            
        //     if (field) {
        //         field.isMandatory = true;
        //     }
        // }
    }

    function beforeSubmit(context) {
        const request = context.request;
        const newRec = context.newRecord;
        const form = context.form;

        // Server-side validation: enforce revision reason only when param is set
        // if (context.type === context.UserEventType.EDIT &&
        //     request && request.parameters &&
        //     request.parameters.custparam_revision === 'true') {
        //     const field = form.getField({
        //             id: 'custbody_st_revision_reason'
        //         });
        //     const reason = newRec.getValue({ fieldId: 'custbody_st_revision_reason' });

        //     if (!reason && field) {
        //         throw Error('Revision Reason is required when revising a Sales Order.');
        //     }
        // }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
});
