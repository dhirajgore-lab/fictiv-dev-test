'use strict';

/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

define(['N/runtime', '../modules/common/f3_fictiv_odoo_integration_cnst'], function(runtime, constant) {

  const { TRANSACTION } = constant;

  /**
   * @param {Object} context
   */
  const beforeLoad = (context) => {
    log.debug({title: 'beforeLoad', details: 'Triggered'});

    try {
      const executionContext = runtime.executionContext;
      if (context.type == 'create' || executionContext != 'USERINTERFACE') {
        return;
      }
      const transactionRecord = context.newRecord;
      const transaction = {};
      transaction.salesOrderId = transactionRecord.id;
      transaction.entityId = transactionRecord.getValue({fieldId: TRANSACTION.CONTACT_ID}) || transactionRecord.getValue({fieldId: TRANSACTION.ENTITY_ID});

      log.debug('transaction', transaction);
      context.form.addButton({
        id: 'custpage_new_email',
        label: 'Email Billing Contact',
        functionName: `onOverwriteEmailPopup('${JSON.stringify(transaction)}')`,
      });
      context.form.clientScriptModulePath = '../client/f3_overwire_sales_email_cs.js';
    } catch (error) {
      log.error({
        title: `beforeLoad => ${error.name}`,
        details: error,
      });
    }
  };


  return {
    beforeLoad
  };
});
