/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 *@NModuleScope SameAccount
 */

const MAX_PAGE_SIZE = 1000;
const CURRENT_VERSION = '1.1.1';

define(['N/error', 'N/log', 'N/record', 'N/query', 'N/search', 'N/config'], (
  _error,
  log,
  record,
  query,
  search,
  config
) => {
  // Get record with provided type & id
  function _get(data) {
    log.debug('Checkpoint', 'Start _get(data)');
    log.debug('_get data:', data);

    const response = {
      status: {
        isSuccess: true,
        statusDetail: '',
      },
      data: null,
      version: CURRENT_VERSION,
    };

    if (data.getVersion) {
      log.debug('getVersion');
    } else {
      try {
        const rec = record.load({
          type: data.type,
          id: data.id,
        });

        response.data = rec;
      } catch (error) {
        response.status.isSuccess = false;
        response.status.statusDetail = error;
        log.error('Error in _get', error);
      }
    }

    log.debug('Checkpoint', 'End _get(data)');
    return JSON.stringify(response);
  }

  // Delete record with provided type & id
  function _delete(data) {
    log.debug('Checkpoint', 'Start _delete(data)');
    log.debug('_delete data:', data);

    const response = {
      status: {
        isSuccess: true,
        statusDetail: '',
      },
      data: null,
      version: CURRENT_VERSION,
    };

    try {
      record.delete({
        type: data.type,
        id: data.id,
      });
    } catch (error) {
      response.status.isSuccess = false;
      response.status.statusDetail = error;
      log.error('Error in _delete', error);
    }

    log.debug('Checkpoint', 'End _delete(data)');
    return JSON.stringify(response);
  }

  // Create record with provided type & id
  function _post(data) {
    log.debug('Checkpoint', 'Start _post(data)');
    log.debug('_post data:', data);
    log.debug('_post data.type:', data.type);

    const response = {
      status: {
        isSuccess: true,
        statusDetail: '',
      },
      data: [],
      version: CURRENT_VERSION,
    };

    try {
      // If SuiteQL query provided, run that and return results
      if (data.q) {
        if (data.runPaged) {
          log.debug('Checkpoint', '_post Running query.runSuiteQLPaged');

          const pagedResults = query.runSuiteQLPaged({
            query: data.q,
            pageSize: data.pageSize || MAX_PAGE_SIZE,
          });

          const iterator = pagedResults.iterator();

          iterator.each((resultPage) => {
            response.data.push(...resultPage.value.data.asMappedResults());
            return true;
          });
        } else {
          log.debug('Checkpoint', '_post Running query.runSuiteQL');

          const results = query.runSuiteQL({
            query: data.q,
          });

          response.data = results.asMappedResults();
        }
      } else if (data.batchLoadRecords) {
        const responseData = [];

        for (const id of data.batchLoadRecords.ids) {
          try {
            const rec = record.load({
              type: data.batchLoadRecords.type,
              id,
            });

            responseData.push({
              id,
              isSuccess: true,
              statusDetail: '',
              data: rec,
            });
          } catch (error) {
            log.error('Error in batchLoadRecords', error);

            responseData.push({
              id,
              isSuccess: false,
              statusDetail: error,
              data: null,
            });
          }
        }

        response.data = responseData;
      } else if (data.loadConfig) {
        response.data = config.load(data.loadConfig);
      } else if (data.search) {
        const pageSize = MAX_PAGE_SIZE;
        const pagedData = search.create(data.search).runPaged({ pageSize });

        const responseData = [];

        const numPages = pagedData.count / pageSize;

        for (let index = 0; index < numPages; index++) {
          responseData.push(pagedData.fetch({ index }));
        }

        response.data = responseData;
      } else if (data.pullFormFields) {
        const response_data = {};

        const vendor = record.create({
          type: record.Type.VENDOR,
          isDynamic: true,
        });

        const vendorFields = [];

        vendor.getFields().forEach((fieldId) => {
          const field = vendor.getField({ fieldId });
          const defaultValue = vendor.getValue({ fieldId });

          if (field) {
            vendorFields.push({
              label: field.label,
              id: field.id,
              type: field.type,
              isMandatory: field.isMandatory,
              isDisplay: field.isDisplay,
              defaultValue,
            });
          }
        });

        const creditCardCharge = record.create({
          type: record.Type.CREDIT_CARD_CHARGE,
          isDynamic: true,
        });

        const creditCardFields = [];

        const sublistId = 'expense';
        let sublistFields = creditCardCharge.getSublistFields({
          sublistId,
        });

        sublistFields.forEach((fieldId) => {
          const field = creditCardCharge.getSublistField({
            sublistId,
            fieldId,
            line: 0,
          });

          if (field) {
            creditCardFields.push({
              label: field.label,
              location: sublistId,
              id: field.id,
              type: field.type,
              isMandatory: field.isMandatory,
              isDisplay: field.isDisplay,
              defaultValue: '',
            });
          }
        });

        creditCardCharge.getFields().forEach((fieldId) => {
          const field = creditCardCharge.getField({ fieldId });
          const defaultValue = creditCardCharge.getValue({ fieldId });

          if (field) {
            creditCardFields.push({
              label: field.label,
              location: 'body',
              id: field.id,
              type: field.type,
              isMandatory: field.isMandatory,
              isDisplay: field.isDisplay,
              defaultValue,
            });
          }
        });

        const billFields = [];

        const bill = record.create({
          type: record.Type.VENDOR_BILL,
          isDynamic: true,
        });

        sublistFields = bill.getSublistFields({ sublistId });

        sublistFields.forEach((fieldId) => {
          const field = bill.getSublistField({
            sublistId,
            fieldId,
            line: 0,
          });

          if (field) {
            billFields.push({
              label: field.label,
              location: sublistId,
              id: field.id,
              type: field.type,
              isMandatory: field.isMandatory,
              isDisplay: field.isDisplay,
              defaultValue: '',
            });
          }
        });

        bill.getFields().forEach((fieldId) => {
          const field = bill.getField({ fieldId });
          const defaultValue = bill.getValue({ fieldId });

          if (field) {
            billFields.push({
              label: field.label,
              location: 'body',
              id: field.id,
              type: field.type,
              isMandatory: field.isMandatory,
              isDisplay: field.isDisplay,
              defaultValue,
            });
          }
        });

        const billPaymentFields = [];

        const billPayment = record.create({
          type: record.Type.VENDOR_PAYMENT,
          isDynamic: true,
        });

        billPayment.getFields().forEach((fieldId) => {
          const field = billPayment.getField({ fieldId });
          const defaultValue = billPayment.getValue({ fieldId });

          if (field) {
            billPaymentFields.push({
              label: field.label,
              location: 'body',
              id: field.id,
              type: field.type,
              isMandatory: field.isMandatory,
              isDisplay: field.isDisplay,
              defaultValue,
            });
          }
        });

        const purchaseOrderFields = [];

        const purchaseOrder = record.create({
          type: record.Type.PURCHASE_ORDER,
          isDynamic: true,
        });

        sublistFields = purchaseOrder.getSublistFields({ sublistId });

        sublistFields.forEach((fieldId) => {
          const field = purchaseOrder.getSublistField({
            sublistId,
            fieldId,
            line: 0,
          });

          if (field) {
            purchaseOrderFields.push({
              label: field.label,
              location: sublistId,
              id: field.id,
              type: field.type,
              isMandatory: field.isMandatory,
              isDisplay: field.isDisplay,
              defaultValue: '',
            });
          }
        });

        purchaseOrder.getFields().forEach((fieldId) => {
          const field = purchaseOrder.getField({ fieldId });
          const defaultValue = purchaseOrder.getValue({ fieldId });

          if (field) {
            purchaseOrderFields.push({
              label: field.label,
              location: 'body',
              id: field.id,
              type: field.type,
              isMandatory: field.isMandatory,
              isDisplay: field.isDisplay,
              defaultValue,
            });
          }
        });

        response_data.global = {
          vendor: vendorFields,
          creditCard: creditCardFields,
          bill: billFields,
          billPayment: billPaymentFields,
          purchaseOrder: purchaseOrderFields,
        };

        response.data = response_data;
      } else {
        log.debug('Checkpoint', '_post Running record.create');

        let rec = null;

        if (data.transform) {
          rec = record.transform({
            fromType: data.transform.fromType,
            fromId: data.transform.fromId,
            toType: data.transform.toType,
            isDynamic: data.isDynamic || false,
            defaultValues: data.defaultValues || {},
          });
        } else {
          rec = record.create({
            type: data.type,
            isDynamic: data.isDynamic || false,
            defaultValues: data.defaultValues || {},
          });
        }

        setFields({ rec, fields: data.fields });

        log.debug('Checkpoint', 'Setting Sublists');

        for (const sublistId in data.sublists) {
          log.debug('Current Sublist:', sublistId);

          for (let line = 0; line < data.sublists[sublistId].length; line++) {
            setSublistValues({
              rec,
              sublistId,
              line,
              fields: data.sublists[sublistId][line],
            });
          }
        }

        handleSublists({ data, rec });

        // Sometimes fields need to be set after sublists are changed,
        // particularly when using dynamic mode
        setFields({ rec, fields: data.setFieldsAfterSublists });

        const saveArgs = data.saveArgs || {};
        const recId = rec.save(saveArgs);
        response.data = recId;
      }
    } catch (error) {
      response.status.isSuccess = false;
      response.status.statusDetail = error;
      log.error('Error in _post', error);
    }

    log.debug('Checkpoint', 'End _post(data)');
    return JSON.stringify(response);
  }

  // Update record with provided type & id
  function _put(data) {
    log.debug('Checkpoint', 'Start _put(data)');
    log.debug('_put data:', data);

    const response = {
      status: {
        isSuccess: true,
        statusDetail: '',
      },
      data: null,
      version: CURRENT_VERSION,
    };

    try {
      const rec = record.load({
        type: data.type,
        id: data.id,
        isDynamic: data.isDynamic || false,
      });

      if (data.fields) {
        delete data.fields.subsidiary;
      }

      setFields({ rec, fields: data.fields });

      log.debug('Checkpoint', 'Setting Sublists in put');

      for (const sublist in data.sublists) {
        log.debug('Current Sublist:', sublist);
        currentCount = rec.getLineCount({ sublistId: sublist });

        for (let i = 0; i < currentCount; i++) {
          rec.removeLine({ sublistId: sublist, line: 0 });
        }

        for (let i = 0; i < data.sublists[sublist].length; i++) {
          setSublistValues({
            rec,
            sublistId: sublist,
            line: i,
            fields: data.sublists[sublist][i],
          });
        }
      }

      handleSublists({ data, rec });

      // Sometimes fields need to be set after sublists are changed,
      // particularly when using dynamic mode
      setFields({ rec, fields: data.setFieldsAfterSublists });

      const saveArgs = data.saveArgs || {};
      const recId = rec.save(saveArgs);
      response.data = recId;
    } catch (error) {
      response.status.isSuccess = false;
      response.status.statusDetail = error;
      log.error('Error in _put', error);
    }

    log.debug('Checkpoint', 'End _put(data)');
    return JSON.stringify(response);
  }

  return {
    get: _get,
    delete: _delete,
    post: _post,
    put: _put,
  };
});

function setSublistValues({ rec, sublistId, line, fields }) {
  /**
   * Set the values of a sublist, regardless of whether it is dynamic or standard
   * See https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4273166777.html
   * for description of args
   */

  if (rec.isDynamic) {
    rec.selectLine({ line, sublistId });
  }

  Object.entries(fields).forEach(([fieldId, value]) => {
    if (fieldId === 'amortizstartdate' || fieldId === 'amortizationenddate') {
      value = new Date(value);
    }

    log.debug('setSublistValues', `${rec} | ${sublistId} | ${line} | ${fieldId} | ${value}`);
    const setArgs = { sublistId, fieldId, value };

    if (rec.isDynamic) {
      rec.setCurrentSublistValue(setArgs);
    } else {
      setArgs.line = line;
      rec.setSublistValue(setArgs);
    }
  });

  if (rec.isDynamic) {
    rec.commitLine({ sublistId });
  }
}

function handleSublists({ data, rec }) {
  /**
   * Handles updating existing sublists on post and put requests.
   * The keys findAndUpdateSublists and addSublists
   * allow a caller to dynamically add or update sublists
   */
  if (data.findAndUpdateSublists) {
    log.debug('Checkpoint', 'findAndUpdateSublists');

    Object.entries(data.findAndUpdateSublists).forEach(([sublistId, sublistArgsList]) => {
      sublistArgsList.forEach(({ findArgs, fields }) => {
        findArgs.sublistId = sublistId;
        const line = rec.findSublistLineWithValue(findArgs);
        setSublistValues({ rec, sublistId, line, fields });
      });
    });
  }

  if (data.addSublists) {
    log.debug('Checkpoint', 'addSublists');

    Object.entries(data.addSublists).forEach(([sublistId, sublistArgsList]) => {
      sublistArgsList.forEach(({ fields }) => {
        let line = rec.getLineCount({ sublistId });
        rec.insertLine({ sublistId, line });
        setSublistValues({ rec, sublistId, line, fields });
        line++;
      });
    });
  }

  if (data.deleteSublists) {
    log.debug('Checkpoint', 'deleteSublists');

    Object.entries(data.deleteSublists).forEach(([sublistId, sublistArgsList]) => {
      sublistArgsList.forEach(({ findArgs }) => {
        findArgs.sublistId = sublistId;
        const line = rec.findSublistLineWithValue(findArgs);
        rec.removeLine({ sublistId, line });
      });
    });
  }
}

function setFields({ rec, fields }) {
  /**
   * Set the fields contained in the `fields` on the record `rec`
   */
  if (!fields) {
    return;
  }

  for (const field in fields) {
    log.debug('Setting fields:', `fieldId: ${field} value: ${fields[field]}`);

    if (field === 'trandate' || field === 'duedate') {
      fields[field] = new Date(fields[field]);
    }

    rec.setValue({
      fieldId: field,
      value: fields[field],
    });
  }
}