'use strict';
/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope Public
 */

define([], function () {
  var SHIPPING_ITEM_ID = 252;

  var getShippingAmount = function getShippingAmount(newRecord) {
    var sublistId = 'item';
    var itemLineCount = newRecord.getLineCount({
      sublistId: sublistId
    });
    var shippingAmount = 0;

    for (var line = 0; line < itemLineCount; line++) {
      var itemId = newRecord.getSublistValue({
        sublistId: sublistId,
        fieldId: 'item',
        line: line
      });

      if (itemId == SHIPPING_ITEM_ID) {
        var amount = newRecord.getSublistValue({
          sublistId: sublistId,
          fieldId: 'amount',
          line: line
        });
        shippingAmount += parseFloat(amount);
      }
    }

    shippingAmount = !isNaN(shippingAmount) ? shippingAmount.toFixed(2) : '';
    return shippingAmount;
  };

  var beforeSubmit = function beforeSubmit(context) {
    log.debug({
      title: 'beforeSubmit',
      details: 'Triggered'
    });

    try {
      if (context.type == 'create' || context.type == 'edit') {
        var newRecord = context.newRecord;
        var shippingAmount = getShippingAmount(newRecord);
        log.debug({
          title: 'shippingAmount',
          details: 'shippingAmount'
        });

        if (shippingAmount) {
          newRecord.setValue({
            fieldId: 'custbody_f3_shipping_cost',
            value: shippingAmount
          });
        }
      }
    } catch (error) {
      log.error({
        title: "beforeSubmit => ".concat(error.name),
        details: JSON.stringify(error)
      });
    }
  };

  return {
    beforeSubmit: beforeSubmit
  };
});