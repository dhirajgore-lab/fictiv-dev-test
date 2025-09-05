/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], (record, log) => {

  const excludeDisplayName = 'Shipping';

  /**
   * Function triggered before record is submitted.
   * @param {Object} context - Script context
   * @param {Record} context.newRecord - The new record instance
   * @param {string} context.type - The trigger type (create, edit, delete, etc.)
   */
  const beforeSubmit = (context) => {
    try {
      const { newRecord } = context;

      const lineCount = newRecord.getLineCount({ sublistId: 'item' });
      let totalAmount = 0;

      for (let i = 0; i < lineCount; i++) {
        const itemDisplay = newRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'item_display',
          line: i
        });

        log.debug('Item Display Name', itemDisplay);

        if (itemDisplay !== excludeDisplayName) {
          const amount = newRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            line: i
          });

          totalAmount += parseFloat(amount) || 0;
        }
      }

      // log.debug('Total Amount (Including Shipping)', totalAmount);
      // Set the calculated sum in the custom body field
      newRecord.setValue({
        fieldId: 'custbody_f3_st_excluding_shipping',
        value: totalAmount
      });

      log.debug('Total Amount (Excluding Shipping)', totalAmount);
    } catch (error) {
      log.error('Error Calculating Total', error);
    }
  };

  return { beforeSubmit };
});
