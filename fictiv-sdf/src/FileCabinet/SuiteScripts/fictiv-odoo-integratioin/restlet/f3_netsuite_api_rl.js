'use strict';
/**
 * @NApiVersion 2.x
 * @NScriptType restlet
 * @NModuleScope Public
 */

define(['N/log', '../modules/managers/api/f3_route_handler', '../modules/managers/api/f3_exception_handler'], function (log, RouteHandler, ExceptionHandler) {
  var post = function post(context) {
    try {
      log.debug({
        title: 'start',
        details: 'Start of API RESTlet'
      });
      return RouteHandler.action(context);
    } catch (error) {
      return ExceptionHandler.routesError(error);
    }
  };

  return {
    post: post
  };
});