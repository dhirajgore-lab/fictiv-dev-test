/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search'], function(search) {
    function beforeSubmit(context) {
        var newRecord = context.newRecord;
        
        // Get the customer ID from the transaction (Customer Deposit or Deposit Application)
        var customerId = newRecord.getValue({ fieldId: 'customer' });
        
        if (customerId) {
            // Fetch the external ID of the customer
            var customerLookup = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customerId,
                columns: ['externalid']
            });
            
            var customerExternalId = customerLookup.externalid;
            
            // Set the external ID in the custom field on the transaction
            if (customerExternalId) {
                newRecord.setValue({
                    fieldId: 'custbodyacs_customer_external_id', // Updated custom field ID
                    value: customerExternalId
                });
            }
        }
    }
    
    return {
        beforeSubmit: beforeSubmit
    };
});
