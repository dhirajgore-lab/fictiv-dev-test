/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/runtime'], function(search, runtime) {
    function onRequest(context) {
        try {
            const userId = runtime.getCurrentUser().id;

            const ECCNcheck = search.lookupFields({
                id: userId,
                type: "employee",
                columns: ["custentity_is_eccn_compliance_employee_"]
            });

            const isEccnCompliant = ECCNcheck.custentity_is_eccn_compliance_employee_ || false;
            log.debug('iseccn',isEccnCompliant)
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });

            context.response.write(JSON.stringify({ isEccnCompliant: isEccnCompliant }));

        } catch (e) {
            log.error("Error in Suitelet", e.message);
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });
            context.response.write(JSON.stringify({ error: e.message }));
        }
    }

    return {
        onRequest: onRequest
    };
});
