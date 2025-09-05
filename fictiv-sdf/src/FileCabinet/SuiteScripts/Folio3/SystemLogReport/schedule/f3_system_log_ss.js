/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope Public
 */

define(["../modules/managers/f3_system_log_ss_manager"], function (manager) {
  const execute = (context) => {
    const filters = "ScheduledScript";
    const logs = manager.getSystemLogs(filters);
  };

  return  {
    execute,
  };

});

