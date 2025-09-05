"use strict";

define(['N/log', '../modules/controller/f3_file_controller', '../modules/configuration/f3_sv_config'], function (log, FileController, Config) {
  /**
   *@NApiVersion 2.x
   *@NScriptType ScheduledScript
   */
  var execute = function execute() {
    var _Config$getInstance = Config.getInstance(),
        isEnabled = _Config$getInstance.isEnabled;

    if (isEnabled) {
      try {
        var statusRecords = FileController.getTaskStatuses();

        if (statusRecords) {
          FileController.verifyTaskStatuses(statusRecords);
        }
      } catch (error) {
        log.error('Error occurred in Executiojn', "".concat(JSON.stringify(error)));
      }
    }
  };

  return {
    execute: execute
  };
});