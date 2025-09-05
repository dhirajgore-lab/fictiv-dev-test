/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

/***************************************************************************************
 ** Copyright (c) 1998-2024 Softype, Inc.
 ** 619, Rajhans, Helix-3, LBS Road, Ghatkopar - West, Mumbai
 ** All Rights Reserved.
 **
 ** This software is the confidential and proprietary information of Softype, Inc. ("Confidential Information").
 **You shall not disclose such Confidential Information and shall use it only in accordance with the terms of
 ** the license agreement you entered into with Softype.
 **
 **@Author :          Jidnesh Madhavi
 ***@Dated : 		  28-05-2025
 **@Version :         2.1
 **@Description :     Suitelet script to get customer deposit amount on invoice print.
 ***************************************************************************************/

 define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    function onRequest(context) {
        try {
            var invNumber = context.request.parameters.inv_no;
            log.debug("Invoice ID", invNumber);

            var invRec = record.load({
                type: "invoice",
                id: invNumber
            });

            var total = parseFloat(invRec.getValue({ fieldId: 'total' })) || 0;
            var amount = 0;

            var lineCount = invRec.getLineCount({ sublistId: 'links' });

            for (var i = 0; i < lineCount; i++) {
                var linkedType = invRec.getSublistText({
                    sublistId: 'links',
                    fieldId: 'type',
                    line: i
                });

                if (linkedType === "Deposit Application") {
                    amount = parseFloat(invRec.getSublistValue({
                        sublistId: 'links',
                        fieldId: 'total',
                        line: i
                    })) || 0;
                    break;
                }
            }

            var htmlstr = '';
            htmlstr += '<table class="total" style="width: 100%; margin-top: 10px;">';
            htmlstr += '<tr><td colspan="4" style="width: 453px;">&nbsp;</td>';
            htmlstr += '<td align="right" style="width: 146px;"><b>${record.subtotal@label}</b></td>';
            htmlstr += '<td align="right" style="width: 165px;">${record.subtotal}</td></tr>';

            htmlstr += '<tr><td colspan="4" style="width: 453px;">&nbsp;</td>';
            htmlstr += '<td align="right" style="width: 146px;"><b>${record.taxtotal@label} (${record.taxrate}%)</b></td>';
            htmlstr += '<td align="right" style="width: 165px;">${record.taxtotal}</td></tr>';

            if (amount > 0) {
                htmlstr += '<tr class="totalrow">';
                htmlstr += '<td background-color="#ffffff" colspan="4">&nbsp;</td>';
                htmlstr += '<td align="right"><b>Deposit Amount</b></td>';
                htmlstr += '<td align="right">' + amount.toFixed(2) + '</td></tr>';

                total = total - amount;
            }

            htmlstr += '<tr class="totalrow">';
            htmlstr += '<td background-color="#ffffff" colspan="4">&nbsp;</td>';
            htmlstr += '<td align="right"><b>${record.total@label}</b></td>';
            htmlstr += '<td align="right">' + total.toFixed(2) + '</td></tr>';
            htmlstr += '</table>';

            context.response.write(htmlstr);

        } catch (e) {
            log.error('Error', e.toString());
        }
    }

    return {
        onRequest: onRequest
    };
});
