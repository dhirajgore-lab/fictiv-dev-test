'use strict';
/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 *@NModuleScope Public
 */

/**
 * [Folio3 License]
 *
 * csv import, ns sales order and ns invoices
 *
 * Version    Date                    Author           Remarks
 * 1.00       2020-1-23              Sanovia
 *
 */

define(['N/log', '../modules/configuration/f3_sv_config', '../modules/controller/f3_file_controller', '../modules/common/f3_fictiv_odoo_integration_cnst'], function (log, Config, FileController, Constants) {
  var ODOO_CUSTOM_RECORD = Constants.CUSTOM_RECORD;

  var processOdooSalesOrderV2Import = function processOdooSalesOrderV2Import() {
    log.debug("Start processing");

    var _Config$getInstance = Config.getInstance(ODOO_CUSTOM_RECORD.ODOO_SALES_ORDER.ID),
        isEnabled = _Config$getInstance.isEnabled;

    log.debug({
      title: 'isEnabled',
      details: isEnabled
    });

    if (!isEnabled) {
      log.error("Configuration Values are not defined for Sales Order v2");
    } else {
      try {
        var files = FileController.getUnprocessedFiles();
        files = FileController.filterFilesFor(Constants.CSV_FILE_MARKER.ODOO_SALES_ORDER_V2, files);

        if (files.length > 0) {
          FileController.startProcessingFiles(files);
        }
      } catch (error) {
        log.error("Error Occurred during execution of Sales Order v2", "".concat(JSON.stringify(error)));
      }
    }
  };

  var execute = function execute() {
    log.audit({
      title: 'Enter execute()',
      details: 'successe'
    });
    processOdooSalesOrderV2Import();
    log.audit({
      title: 'Exit execute()',
      details: 'successe'
    });
  };

  return {
    execute: execute
  };
});