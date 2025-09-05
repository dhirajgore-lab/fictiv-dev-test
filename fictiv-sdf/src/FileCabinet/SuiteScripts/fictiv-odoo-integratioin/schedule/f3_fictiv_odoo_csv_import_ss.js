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
 * 1.00       2019-10-22              Khalid
 *
 */

define(['N/log', '../modules/configuration/f3_sv_config', '../modules/controller/f3_file_controller', '../modules/common/f3_fictiv_odoo_integration_cnst'], function (log, Config, FileController, Constants) {
  var ODOO_CUSTOM_RECORD = Constants.CUSTOM_RECORD;

  var processOdooSalesOrderImport = function processOdooSalesOrderImport() {
    log.debug("Start processing ".concat(ODOO_CUSTOM_RECORD.ODOO_SALES_ORDER.LABEL));

    var _Config$getInstance = Config.getInstance(ODOO_CUSTOM_RECORD.ODOO_SALES_ORDER.ID),
        isEnabled = _Config$getInstance.isEnabled;

    log.debug({
      title: 'isEnabled',
      details: isEnabled
    });

    if (!isEnabled) {
      log.error("Configuration Values are not defined for ".concat(ODOO_CUSTOM_RECORD.ODOO_SALES_ORDER.LABEL, "."));
    } else {
      try {
        var files = FileController.getUnprocessedFiles();
        files = FileController.filterFilesFor(Constants.CSV_FILE_MARKER.ODOO_SALES_ORDER, files);

        if (files.length > 0) {
          FileController.startProcessingFiles(files);
        }
      } catch (error) {
        log.error("Error Occurred during execution of ".concat(ODOO_CUSTOM_RECORD.ODOO_SALES_ORDER.LABEL), "".concat(JSON.stringify(error)));
      }
    }
  };

  var processOdooDeliveryOrderImport = function processOdooDeliveryOrderImport() {
    log.debug("Start processing ".concat(ODOO_CUSTOM_RECORD.ODOO_DELIVERY_ORDER.LABEL)); // global.G_ODOO_CUSTOM_RECORD_ID = ODOO_CUSTOM_RECORD.ODOO_DELIVERY_ORDER.ID;

    var _Config$getInstance2 = Config.getInstance(ODOO_CUSTOM_RECORD.ODOO_DELIVERY_ORDER.ID),
        isEnabled = _Config$getInstance2.isEnabled;

    if (!isEnabled) {
      log.error("Configuration Values are not defined for ".concat(ODOO_CUSTOM_RECORD.ODOO_DELIVERY_ORDER.LABEL, "."));
    } else {
      try {
        var files = FileController.getUnprocessedFiles();
        files = FileController.filterFilesFor(Constants.CSV_FILE_MARKER.ODOO_DELIVERY_ORDER, files);

        if (files.length > 0) {
          FileController.startProcessingFiles(files);
        }
      } catch (error) {
        log.error("Error Occurred during execution of ".concat(ODOO_CUSTOM_RECORD.ODOO_DELIVERY_ORDER.LABEL), "".concat(JSON.stringify(error)));
      }
    }
  };

  var execute = function execute() {
    log.audit({
      title: 'Enter execute()',
      details: 'successe'
    });
    processOdooSalesOrderImport();
    processOdooDeliveryOrderImport();
    log.audit({
      title: 'Exit execute()',
      details: 'successe'
    });
  };

  return {
    execute: execute
  };
});