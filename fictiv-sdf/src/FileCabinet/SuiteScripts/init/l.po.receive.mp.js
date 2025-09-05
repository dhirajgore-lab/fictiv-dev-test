/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @description 期初批量接收采购订单
 */
define(['N/runtime','N/record','N/search','N/log'],

function(runtime,record,search,log) {
   
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        var orders = [];
        search.load({ type: 'purchaseorder', id: 'customsearch_dps_po_to_receipt' })
        .run().each(function (rec) {
        //	log.audit('获取rec', rec.getValue(rec.columns[0]));
             orders.push(rec.id);
        return true;
        });
        return orders;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        try {
            var po_id = context.value
            var po1 = record.load({type:"purchaseorder",id:po_id})
            po1.save();
            var po = record.load({type:"purchaseorder",id:po_id})
            var tranid = po.getValue('tranid');
            var location = po.getValue('location');
            var trandate = po.getText('custbody_dps_po_received_date');
            var trandates = trandate.split('-');
            var pici = tranid+trandates[1]+trandates[2];
            log.debug('APPROVAL STATUS',po.getValue('approvalstatus'))
            log.debug('tranid',po.getValue('tranid'))
            

            var RECEIPT = record.transform({
                fromType:'purchaseorder',
                toType: record.Type.ITEM_RECEIPT,
                fromId: Number(po_id),
                 isDynamic:true
              })
            RECEIPT.setText({fieldId:'trandate',text: trandate});
            var lr = RECEIPT.getLineCount({ sublistId: 'item' });
            var receipt_linecount = 0;
            for (var i = 0; i < lr; i++) {
                RECEIPT.selectLine({sublistId: 'item',line:i})
                var itemtype = RECEIPT.getSublistValue({ sublistId: 'item', fieldId: 'itemtype',line:i});		//货品类型
                log.error('itemtype',itemtype)
                if(itemtype == 'OTHCHARGE') continue
                
                var line_no = RECEIPT.getSublistValue({ sublistId: 'item', fieldId: 'custcol_dps_line_no',line:i})
                var po_line = po.findSublistLineWithValue({ sublistId: 'item', fieldId: 'custcol_dps_line_no', value: line_no });
                
                log.error('line_no',line_no)
                log.error('po_line',po_line)
                if (po_line == -1) {
                    po.save();
                    log.error('PO无行号',"保存PO触发行号生成脚本，下次在接收")  
                    return;  
                }
                var po_rate = po.getSublistValue({sublistId: 'item', fieldId: 'rate', line: po_line})

                var itemre = RECEIPT.getSublistValue({ sublistId: 'item', fieldId: 'item',line:i})
                var quantity = RECEIPT.getSublistValue({ sublistId: 'item', fieldId: 'custcol_dps_po_received_quantity',line:i})
                log.debug('quantity '+i,po.getValue('quantity'))
                if (!quantity||quantity == 0) {
                    RECEIPT.setCurrentSublistValue({ sublistId: 'item', fieldId: 'itemreceive', value: false});
                    continue
                }
                receipt_linecount++;
                RECEIPT.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value:location});
                RECEIPT.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value:po_rate});
                RECEIPT.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_dps_po_received_rate', value:po_rate});
                
                RECEIPT.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value:quantity});
                try {
                    var re_inventorydetail = RECEIPT.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail'})
                    re_inventorydetail.selectNewLine({ sublistId: 'inventoryassignment'})
                    // re_inventorydetail.setCurrentSublistText({ sublistId: 'inventoryassignment', 
                    //                    fieldId: 'issueinventorynumber', text:tranid});
                    re_inventorydetail.setCurrentSublistText({ sublistId: 'inventoryassignment', 
                                    fieldId: 'receiptinventorynumber', text: pici});
                    re_inventorydetail.setCurrentSublistValue({ sublistId: 'inventoryassignment', 
                                   fieldId: 'quantity', value: quantity}); 
                
                    re_inventorydetail.commitLine({ sublistId: 'inventoryassignment'}) 
                    RECEIPT.commitLine({ sublistId: 'item'}) 
                } catch (error) {
                    log.error('库存详细信息报错',error)  
                }
                                                 
            }
            if (receipt_linecount == 0) {
                log.error('收货失败'+context.value,'收货数量为零') 
                return;
            }
                var RECEIPT_SAVE = RECEIPT.save({ignoreMandatoryFields:true})
                log.audit('收货成功',RECEIPT_SAVE) 
                record.submitFields({
                    type: 'purchaseorder',
                    id: Number(po_id),
                    values: {
                        'custbody_dps_init_receipted': true
                    }
                });
        } catch (error) {
            log.error('收货失败'+context.value,error)
        }
        
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
