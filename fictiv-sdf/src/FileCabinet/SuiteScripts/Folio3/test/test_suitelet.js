'use strict';

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

/**
 *
 *
 * Date             @author         @version    Comments
 *
 */

define(['N/ui/serverWidget', 'N/config'], (serverWidget, config) => {
  const onRequest = (context) => {
    const companyInfo = config.load({
      type: config.Type.COMPANY_INFORMATION,
    });

    const companyTimezone = companyInfo.getValue({
      fieldId: 'timezone',
    });

    const form = serverWidget.createForm({
      title: 'Test',
    });

    const pageHtml = form.addField({
      id: 'custpage_test_html',
      label: 'HTML',
      type: serverWidget.FieldType.INLINEHTML,
    });
    pageHtml.defaultValue = `<h1>Company Timezone: ${companyTimezone}</h1>`;

    // form.clientScriptModulePath = CLIENT_SCRIPT_PATH;
    context.response.writePage(form);
  };

  return {
    onRequest,
  };
});
