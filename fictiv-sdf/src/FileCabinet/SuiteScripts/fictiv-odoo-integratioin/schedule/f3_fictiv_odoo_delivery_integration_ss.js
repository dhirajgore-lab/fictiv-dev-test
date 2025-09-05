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
 * 1.00       2019-10-07              Khalid
 *
 */

define(['N/log', '../modules/dao/f3_fictiv_odoo_integration_dao'], function (log, DAO) {
  // <reference path="../modules/dao/f3_fictiv_odoo_integration_dao.js" />

  /**
   * Main Module
   * @module f3/Main
   * @see module:f3/DAO.run
   */

  /**
   * Scheduled Script Entry point, delegate all heavy lifting toward DAO mudule.
   * [DAO.run]{@link module:f3/DAO}
   * @function
   * @param {module:f3/DAO.run} context NetSuite provided object
   */
  var execute = function execute(context) {
    log.audit({
      title: 'enter execute',
      details: 'success'
    }); // DAO.run(context);

    try {
      /**
       * Delegate
       * [DAO.run]{@link module:f3/DAO.run}
       * @see module:f3/DAO.run
       */
      DAO.processDeliveryOrder();
    } catch (e) {
      log.error({
        title: e.name,
        details: e.message
      });
    }

    log.audit({
      title: 'exit execute',
      details: 'success'
    });
  };

  return {
    execute: execute
  };
});