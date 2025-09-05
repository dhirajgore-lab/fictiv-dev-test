"use strict";

define(['N/record', 'N/render', 'N/file'], function (record, render, file) {
  /**
   * @NApiVersion 2.x
   * @NScriptType Suitelet
   */
  function onRequest(context) {
    var request = context.request;
    var response = context.response;

    if (request.method === 'GET') {
      // Get the Sales Order ID from the URL parameter
      var salesOrderId = request.parameters.soid; // Load the Sales Order record

      var salesOrderRecord = record.load({
        type: record.Type.SALES_ORDER,
        id: salesOrderId
      }); // Generate PDF (this part will depend on your specific requirements)

      var pdfFile = renderProformaPDF(salesOrderRecord); // Set the response to return the PDF

      response.writeFile({
        file: pdfFile,
        isInline: true
      });
    }
  }

  function renderProformaPDF(salesOrderRecord) {
    var renderer = render.create(); // renderer.setTemplateByScriptId('CUSTTMPL_110_4541795_SB1_313'); // Sandbox:  'CUSTTMPL_110_4541795_SB1_313'

    renderer.setTemplateByScriptId('CUSTTMPL_406_4541795_194'); // Production:  'CUSTTMPL_110_4541795_313'

    var termID = salesOrderRecord.getValue('terms');
    var datedue = ' ';

    if (termID) {
      log.debug('termID', termID);
      var termRecord = record.load({
        type: 'term',
        id: termID
      });
      var daysuntilnetdue = termRecord.getValue('daysuntilnetdue');
      var trandate = salesOrderRecord.getValue('trandate');
      log.debug('daysuntilnetdue', daysuntilnetdue);
      log.debug('trandate', trandate); // Calculate datedue

      var trandateObj = new Date(trandate);
      trandateObj.setDate(trandateObj.getDate() + daysuntilnetdue);
      datedue = trandateObj.toISOString().split('T')[0]; // Format datedue as YYYY-MM-DD

      log.debug('datedue', datedue); // Add the custom due date as a data source in the renderer
    }

    renderer.addCustomDataSource({
      format: render.DataSource.OBJECT,
      alias: 'customData',
      data: {
        datedue: datedue
      }
    });
    renderer.addRecord('record', salesOrderRecord);
    return renderer.renderAsPdf();
  }

  return {
    onRequest: onRequest
  };
});