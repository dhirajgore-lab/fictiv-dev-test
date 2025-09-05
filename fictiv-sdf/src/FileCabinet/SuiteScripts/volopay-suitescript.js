/**
 * volopay_suitscript.js
 *
 *
 * @exports post
 *
 * @copyright 2021
 * @author Vishal <vishal@volopay.co>
 *
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 * Setup following Permission are required while adding role in net suit account
 * Transactions => Transfer Funds, Make Journal Entry, FIND TRANSACTIONS
 * LIST => ACCOUNT, SUBSIDIARIES, Vendor,
 */

// https://stackoverflow.com/questions/51291776/typeerror-cannot-find-function-includes-in-object-even-though-the-object-is-an
var DATE_FIELDS = ["trandate", "duedate"];

define(["N/search", "N/record", "N/format", "N/file"], function (
  search,
  record,
  format,
  file
) {
  var MODULE_NAME = "VOLO_COA_MODULE";

  function throwError(method, msg) {
    throw "Volo Script error method:" + method + "msg: " + msg;
  }

  function getBankRecords(payload, modules) {
    filters = payload.filters || [];

    if (filters.length) {
      filters.push("and");
    }

    filters.push(["type", "IS", "Bank"]);

    var searchResult = modules.search.create({
      type: modules.record.Type.ACCOUNT,
      columns: payload.columns || [],
      filters: filters,
    });

    var resultSet = searchResult.run();
    var resultRange = resultSet.getRange({
      start: payload.rangeStart || 0,
      end: payload.rangeEnd || 1000,
    });

    return loadRecords(resultRange, "account", true, modules);
  }

  function loadRecords(records, recordType, isDynamic, modules) {
    return records.map(function (r) {
      return modules.record.load({
        type: recordType,
        id: r.id,
        isDynamic: isDynamic,
      });
    });
  }

  function searchRecord(payload, modules) {
    var search = modules.search;

    if (!payload.recordType || !payload.columns) {
      throwError("searchRecord", "Please make sure you have passed recordType and columns");
    }

    var columns = payload.columns.split(":");

    var filters = [];
    if (payload.filters) {
      filters = payload.filters.map(function(filter) {
        if (!Array.isArray(filter)) {
          throwError("searchRecord", "Each filter must be an array");
        }

        return search.createFilter({
          name: filter[0],
          operator: filter[1],
          values: filter[2]
        });
      });
    }

    var searchResult = search.create({
      type: payload.recordType,
      columns: columns.map(function(name) {
        return search.createColumn({ name: name });
      }),
      filters: filters
    });

    // Run the search and get results
    var resultSet = searchResult.run();
    var resultRange = resultSet.getRange({
      start: payload.rangeStart || 0,
      end: payload.rangeEnd || 1000,
    });

    // Fetch associations if required
    if (payload.isLoadRecord) {
      return loadRecords(resultRange, payload.recordType, payload.isDynamic, modules);
    }

    return resultRange;
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   */
  function createVendorBill(payload, modules) {
    var record = modules.record;
    var format = modules.format;
    var vendorBill = record.create({
      type: record.Type.VENDOR_BILL,
      isDynamic: true,
    });

    if (payload.fields) {
      Object.keys(payload.fields).forEach(function (key) {
        var val = payload.fields[key];
        if (key == 'account') {
          val = format.format({
            value: val,
            type: format.Type.IDENTIFIER,
          });
        }
        if (DATE_FIELDS.indexOf(key) > -1) {
          val = format.parse({
            value: payload.fields[key],
            type: format.Type.DATE,
          });
        }
        vendorBill.setValue(key, val);
      });
    }

    payload.lines.forEach(function (line) {
      var lineType = line.type || "expense";
      vendorBill.selectNewLine(lineType);

      Object.keys(line.fields).forEach(function (key) {
        var val = line.fields[key];
        if (key === "amortizstartdate" || key === "amortizationenddate") {
          val = format.parse({
            value: line.fields[key],
            type: format.Type.DATE,
          });
        }
        vendorBill.setCurrentSublistValue(lineType, key, val);
      });
      vendorBill.commitLine(lineType);
    });

    vendorBill.save();

    if (payload.receipts) {
      payload.receipts.forEach(function (receipt) {
        createFile(
          {
            file: receipt,
            attachTo: {
              recordType: record.Type.VENDOR_BILL,
              id: vendorBill.id,
            },
          },
          modules
        );
      });
    }

    return vendorBill;
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   */
  function updateVendorBill(payload, modules) {
    var record = modules.record;
    var format = modules.format;
    var vendorBillId = payload.vendor_bill_id;

    var vendorBill = record.load({
      type: record.Type.VENDOR_BILL,
      id: vendorBillId,
      isDynamic: true,
    });
  
    if (payload.fields) {
      Object.keys(payload.fields).forEach(function (key) {
        var val = payload.fields[key];
        if (key == 'account') {
          val = format.format({
            value: val,
            type: format.Type.IDENTIFIER,
          });
        }
        if (DATE_FIELDS.indexOf(key) > -1) {
          val = format.parse({
            value: payload.fields[key],
            type: format.Type.DATE,
          });
        }
        vendorBill.setValue(key, val);
      });
    }

    if (payload.lines && Array.isArray(payload.lines)) {
      var lineCount = vendorBill.getLineCount({ sublistId: "expense" });

      for (var i = lineCount - 1; i >= 0; i--) {
        vendorBill.removeLine({ sublistId: "expense", line: i });
      }

      payload.lines.forEach(function (line) {
        var lineType = line.type || "expense";
        vendorBill.selectNewLine(lineType);
        Object.keys(line.fields).forEach(function (key) {
          var val = line.fields[key];
          if (key === "amortizstartdate" || key === "amortizationenddate") {
            val = format.parse({
              value: line.fields[key],
              type: format.Type.DATE,
            });
          }
          vendorBill.setCurrentSublistValue(lineType, key, val);
        });
        vendorBill.commitLine(lineType);
      });
    }
  
    vendorBill.save();
  
    if (payload.receipts) {
      payload.receipts.forEach(function (receipt) {
        createFile(
          {
            file: receipt,
            attachTo: {
              recordType: record.Type.VENDOR_BILL,
              id: vendorBill.id,
            },
          },
          modules
        );
      });
    }
  
    return vendorBill;
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   */
  function createExpenseReport(payload, modules) {
    var record = modules.record;
    var format = modules.format;

    var expenseReport = record.create({
      type: record.Type.EXPENSE_REPORT,
      isDynamic: true,
    });

    if (payload.fields) {
      Object.keys(payload.fields).forEach(function (key) {
        var val = payload.fields[key];
        if (DATE_FIELDS.indexOf(key) > -1) {
          val = format.parse({
            value: payload.fields[key],
            type: format.Type.DATE,
          });
        }
        expenseReport.setValue(key, val);
      });
    }

    payload.lines.forEach(function (line) {
      var lineType = line.type || "expense";
      expenseReport.selectNewLine(lineType);
      Object.keys(line.fields).forEach(function (key) {
        var val = line.fields[key];
        if (key === 'expensedate') {
          val = format.parse({
            value: line.fields[key],
            type: format.Type.DATE,
          });
        }
        expenseReport.setCurrentSublistValue(lineType, key, val);
      });
      expenseReport.commitLine(lineType);
    });

    expenseReport.save();

    if (payload.receipts) {
      payload.receipts.forEach(function (receipt) {
        createFile(
          {
            file: receipt,
            attachTo: {
              recordType: record.Type.EXPENSE_REPORT,
              id: expenseReport.id,
            },
          },
          modules
        );
      });
    }

    return expenseReport;
  }

  function billPayment(payload, modules) {
    var vendorBillPayment = modules.record.create({
      type: modules.record.Type.VENDOR_PAYMENT,
      isDynamic: payload.isDynamic,
    });

    if (payload.fields) {
      Object.keys(payload.fields).forEach(function (key) {
        var val = payload.fields[key];
        vendorBillPayment.setValue(key, val);
      });
    }

    var numberOfTransactions = vendorBillPayment.getLineCount({
      sublistId: "apply",
    });

    var internalIdIndexMap = {};

    for (var i = 0; i < numberOfTransactions; i++) {
      var internalId = ""
      try {
        internalId = vendorBillPayment.getSublistValue({
          sublistId: "apply",
          fieldId: "internalid",
          line: i,
        });
        internalIdIndexMap[internalId] = i;
      } catch(e) {
        log.debug("indx", i)
        log.debug("internalIdIndexMap", internalIdIndexMap)
      }
    }
    log.debug("internalIdIndexMap FILE", JSON.stringify(internalIdIndexMap))
    

    payload.lines.forEach(function (line) {
      vendorBillPayment.selectLine({
        sublistId: "apply",
        line: internalIdIndexMap[line.internalid],
      });

      vendorBillPayment.setCurrentSublistValue({
        sublistId: "apply",
        fieldId: "apply",
        value: true,
      });

      if (line.fields) {
        Object.keys(line.fields).forEach(function (key) {
          vendorBillPayment.setCurrentSublistValue({
            sublistId: "apply",
            fieldId: key,
            value: line.fields[key],
          });
        });
      }

      vendorBillPayment.commitLine("apply");
    });

    return vendorBillPayment.save();
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   *
   * payload =  {journal: {}, lines: [{amount: '', transType: '', fields: {account: '', memo: '' etc}}]}
   *
   */

  function addJournalEntry(payload, modules) {
    var record = modules.record;
    var format = modules.format;

    var journal = record.create({
      type: record.Type.JOURNAL_ENTRY,
      isDynamic: true,
    });

    // default to false
    journal.setValue("approved", false);

    // set journal data
    if (payload.journal) {
      Object.keys(payload.journal).forEach(function (key) {
        var val = payload.journal[key];
        if (DATE_FIELDS.indexOf(key) > -1) {
          val = format.parse({
            value: payload.journal[key],
            type: format.Type.DATE,
          });
        }

        journal.setValue(key, val);
      });
    }

    // Journal line entry
    // first line currency should be base journal currency
    payload.lines.forEach(function (line) {
      journal.selectNewLine("line");

      if (!line.transType) {
        throwError(
          "addJournalEntry",
          "transType key in line not present, please mention credit , debit as value for each line"
        );
      }

      journal.setCurrentSublistValue("line", line.transType, line.amount);
      Object.keys(line.fields).forEach(function (key) {
        var val = line.fields[key];

        if (key === "account") {
          val = format.format({ value: val, type: format.Type.IDENTIFIER });
        }

        journal.setCurrentSublistValue("line", key, val);
      });
      journal.commitLine("line");
    });

    journal.save();

    if (payload.receipts) {
      payload.receipts.forEach(function (receipt) {
        createFile(
          {
            file: receipt,
            attachTo: {
              recordType: record.Type.JOURNAL_ENTRY,
              id: journal.id,
            },
          },
          modules
        );
      });
    }

    return journal;
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   *
   * payload =  {journal_id: '', credit_account: ''}
   *
   */
  function updateJournalEntry(payload, modules) {
    var record = modules.record;
    var format = modules.format;

    var journalId = payload.journal_id
    var newAccountValue = payload.credit_account

    try {
      // Load existing journal entry
      var journal = record.load({
        type: record.Type.JOURNAL_ENTRY,
        id: journalId,
        isDynamic: true,
      });
  
      var lineCount = journal.getLineCount({
        sublistId: 'line'
      });
  
      // Update lines
      for(var i = 0; i < lineCount; i++) {
        journal.selectLine({
          sublistId: 'line',
          line: i
        });
  
        var credit = journal.getCurrentSublistValue({
          sublistId: 'line',
          fieldId: 'credit'
        });

        // Check if the credit amount exists
        if (credit) {
          var val = format.format({
            value: newAccountValue,
            type: format.Type.IDENTIFIER
          });

          // migrate expense credit from volobank to the new credit account
          journal.setCurrentSublistValue('line', 'account', val);
          journal.commitLine('line');
        }
      }
  
      // Save the journal entry
      var journalId = journal.save();
      return journalId
    } catch (error) {
      throw new Error("Error updating journal entry: " + error);
    }
  }
  

  /**
   *
   * @param {*} payload
   * @param {*} modules
   * {
   *  file: {
   *    name: '',
   *    type: '',
   *    content: '',
   *    folder: ''
   *  },
   *  attachTo: {
   *    recordType: '',
   *    id: ''
   *  }
   * }
   */
  function createFile(payload, modules) {
    // log.debug("CREATE FILE", JSON.stringify(payload))
    var fm = modules.file;
    var file = payload.file;
    var attachTo = payload.attachTo;

    if (!file || !file.name || !file.type || !file.content) {
      throwError(
        "createFile",
        "file, file.name , file.type, file.content are required"
      );
    }

    // log.debug(fm.Type.PLAINTEXT);
    // log.debug(fm.Type);
    var fileObj = fm.create({
      name: file.name,
      fileType: file.type,
      contents: file.content,
    });

    fileObj.folder = file.folder;

    fileId = fileObj.save();

    if (payload.attachTo) {
      attachFile(
        {
          fileId: fileId,
          record: {
            recordType: attachTo.recordType,
            id: attachTo.id,
          },
        },
        modules
      );
    }

    return fileId;
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   */
  function attachFile(payload, modules) {
    // log.debug("ATTACH FILE", JSON.stringify(payload))
    var record = payload.record;
    var fileId = payload.fileId;
    // log.debug(fileId)
    // log.debug(record)
    if (!fileId || !record) {
      throwError("attachFile", "file and record are required");
    }

    modules.record.attach({
      record: {
        type: "file",
        id: fileId,
      },
      to: {
        type: record.recordType,
        id: record.id,
      },
    });

    return record;
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   */
  function createRecord(payload, modules) {
    var rm = modules.record;

    if (!payload.recordType) {
      throwError("createRecord", "recordType is required");
    }

    var createParams = {
      type: payload.recordType,
    };

    if (payload.hasOwnProperty("isDynamic")) {
      createParams.isDynamic = payload.isDynamic;
    }

    var record = rm.create(createParams);

    if (payload.fields) {
      Object.keys(payload.fields).forEach(function (key) {
        var val = payload.fields[key];
        if (key === 'currencyList' && payload.recordType == "vendor") {
          val.forEach(function (currencyId) {
            record.selectNewLine({ sublistId: 'currency' });
            record.setCurrentSublistValue({
              sublistId: 'currency',
              fieldId: 'currency',
              value: currencyId
            });
            record.commitLine({ sublistId: 'currency' });
          });
        } else {
          record.setValue({ fieldId: key, value: val });
        }
      });
    }

    return record.save();
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   */
  function updateRecord(payload, modules) {
    var record = modules.record.load({
      type: payload.recordType,
      id: payload.id,
      isDynamic: payload.hasOwnProperty("isDynamic") ? payload.isDynamic : false,
    });
  
    if (payload.fields) {
      Object.keys(payload.fields).forEach(function (key) {
        var val = payload.fields[key];
        if (key === 'currencyList' && payload.recordType === "vendor") {
          val.forEach(function (currencyId) {
            var lineExists = false;
            var lineCount = record.getLineCount({ sublistId: 'currency' });
            for (var i = 0; i < lineCount; i++) {
              if (record.getSublistValue({ sublistId: 'currency', fieldId: 'currency', line: i }) === currencyId) {
                lineExists = true;
                break;
              }
            }

            // If it doesn't exist, append it
            if (!lineExists) {
              record.selectNewLine({ sublistId: 'currency' });
              record.setCurrentSublistValue({
                sublistId: 'currency',
                fieldId: 'currency',
                value: currencyId
              });
              record.commitLine({ sublistId: 'currency' });
            }
          });
        } else {
          record.setValue({ fieldId: key, value: val });
        }
      });
    }
  
    // Save the record once after all updates
    record.save();
  
    return record;
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   */
  function findRecord(payload, modules) {
    var record = modules.record.load({
      type: payload.recordType,
      id: payload.id,
    });

    return record;
  }

  /**
   *
   * @param {*} payload
   * @param {*} modules
   */
  function deleteRecord(payload, modules) {
    return modules.record.delete({
      type: payload.recordType,
      id: payload.id,
    });
  }

  function getRecordMetadata(recordType, modules) {
    var rm = modules.record;
    var record = rm.create({ type: recordType }); // Create a dummy record of the desired type

    var metadata = {
      sublists: []
    };

    var sublists = record.getSublists();

    sublists.forEach(function (sublistId) {
      try {
        record.selectNewLine({ sublistId: sublistId });
        record.cancelLine({ sublistId: sublistId });
      } catch (e) {
        // Ignore any errors if the sublist doesnt define the methods
      }
  
      var sublistFields;
      try {
        sublistFields = record.getSublistFields({ sublistId: sublistId });
      } catch (e) {
        sublistFields = ['Unable to retrieve fields'];
      }

      metadata.sublists.push({
        sublist_name: sublistId,
        fields: sublistFields
      });
    });

    return metadata;
  }

  RESOURCE_MAP = {
    searchRecord: searchRecord,
    addJournalEntry: addJournalEntry,
    updateJournalEntry: updateJournalEntry,
    createRecord: createRecord,
    attachFile: attachFile,
    createFile: createFile,
    getBankRecords: getBankRecords,
    updateRecord: updateRecord,
    findRecord: findRecord,
    deleteRecord: deleteRecord,
    getRecordMetadata: getRecordMetadata,
    createVendorBill: createVendorBill,
    updateVendorBill: updateVendorBill,
    billPayment: billPayment,
    createExpenseReport: createExpenseReport
  };

  MODULES = {
    search: search,
    record: record,
    format: format,
    file: file,
  };

  return {
    post: function (request) {
      return RESOURCE_MAP[request.method](request.payload, MODULES);
    },
  };
});
