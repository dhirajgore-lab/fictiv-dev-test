"use strict";

define([], function () {
  /**
   * @NApiVersion 2.x
   * @NScriptType UserEventScript
   */
  function beforeLoad(context) {
    // Only add the button on view mode
    if (context.type !== context.UserEventType.VIEW) {
      return;
    }

    var form = context.form; // Add the "Print Proforma PDF" button to the form

    form.addButton({
      id: 'custpage_print_proforma_pdf',
      label: 'Print Proforma PDF',
      functionName: 'onPrintProformaPDF'
    }); // Attach the client script to the form

    form.clientScriptModulePath = '../client/f3_print_proforma_pdf_cs.js'; // Make sure to replace with the correct file path
  }

  return {
    beforeLoad: beforeLoad
  };
});