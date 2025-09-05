"use strict";

define(["N/search", "N/record"], function (search, record) {
  /**
   *@NApiVersion 2.x
   *@NScriptType ScheduledScript
   */
  var execute = function execute() {
    var salesorderSearchObj = search.create({
      type: "invoice",
      filters: [["type", "anyof", "CustInvc"], "AND", ["trandate", "within", "11/5/2023", "12/1/2023"], "AND", ["mainline", "is", "T"], "AND", ["custbody_f3_odoo_name", "isempty", ""], "AND", ["customform", "anyof", "127"], "AND", ["custbody_f3_so_id", "isempty", ""]],
      columns: [search.createColumn({
        name: "externalid",
        label: "External ID"
      }), search.createColumn({
        name: "custbody_f3_odoo_name",
        label: "Odoo Name"
      }), search.createColumn({
        name: "custbody_f3_odoo_name",
        join: "createdFrom",
        label: "Odoo Name"
      })]
    });
    var searchResultCount = salesorderSearchObj.runPaged().count;
    log.debug("salesorderSearchObj result count", searchResultCount);
    salesorderSearchObj.run().each(function (result) {
      var externalId = result.getValue({
        name: "externalid"
      });
      var odooName = result.getValue({
        name: "custbody_f3_odoo_name"
      });
      var soOdooName = result.getValue({
        name: "custbody_f3_odoo_name",
        join: "createdFrom"
      });
      log.debug("{externalId, odooName, soOdooName, id}", {
        externalId: externalId,
        odooName: odooName,
        soOdooName: soOdooName,
        id: result.id
      });

      if (!odooName && externalId) {
        var updatedSOId = record.submitFields({
          type: 'invoice',
          id: result.id,
          values: {
            custbody_f3_odoo_name: soOdooName,
            custbody_f3_so_id: soOdooName
          }
        });
        log.debug("updatedSOId", updatedSOId); // const invoiceRecord = record.load({type: 'invoice', id: result.id});
        // invoiceRecord.setValue({fieldId: 'custbody_f3_odoo_name', value: soOdooName});
        // const udatedInvoiceId = invoiceRecord.save();
        // log.debug("udatedInvoiceId", udatedInvoiceId);
      }

      return true;
    });
  };

  return {
    execute: execute
  };
});