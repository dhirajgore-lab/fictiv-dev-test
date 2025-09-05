/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime'], function(record, search, runtime) {

    function beforeLoad(context) {
        var currentRec = context.newRecord;

        if (!['view', 'edit', 'copy'].includes(context.type)) return;

        var userId = runtime.getCurrentUser().id;
        var userRoleId = runtime.getCurrentUser().role;
        log.debug("user role",userRoleId)

        var employeeData = search.lookupFields({
            type: 'employee',
            id: userId,
            columns: ['custentity_is_eccn_compliance_employee_', 'custentity_st_working_in_geography_']
        });

        var countryCodeMap = {
            'india': 'IN',
            'china': 'CN',
            'usa': 'US',
            'united states': 'US',
            'mexico': 'MX'
        };

        var geo = employeeData.custentity_st_working_in_geography_;
        var geographyCode = '';
        if (Array.isArray(geo) && geo.length > 0) {
            geographyCode = countryCodeMap[geo[0].text.toLowerCase()] || geo[0].text;
        }

        var isEccnUser = employeeData.custentity_is_eccn_compliance_employee_;

        var lineCount = currentRec.getLineCount({ sublistId: 'item' });

        let atLeastOneVisible = false;

        for (var i = 0; i < lineCount; i++) {
            var itemId = currentRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });
        
            var itemFields = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ['custitem_st_eccn_compliance_', 'custitem_st_allow_country_visibility_']
            });
        
            var eccn = itemFields.custitem_st_eccn_compliance_;
            var allowedCountriesRaw = itemFields.custitem_st_allow_country_visibility_ || '';
            var allowedCountriesArray = allowedCountriesRaw.split(';');
            log.debug("Allowed Countries",allowedCountriesArray)
            if (eccn === true) {
                var allowed = (isEccnUser === true && allowedCountriesArray.includes(geographyCode)) || userRoleId == "3";
                if (allowed) {
                    atLeastOneVisible = true;
                    log.debug("Allowed",itemId)
                }
            } else if (geographyCode == "CN" && allowedCountriesArray.includes("US")) {
                // restricted
                log.debug("else if")
            } else {
                // Non-ECCN or open item
                log.debug("else")
                atLeastOneVisible = true;
            }
        }
        
        if (!atLeastOneVisible) {
            log.debug("error", "error")
            throw "Error - Something Went Wrong.";
            
        }
        
    }

    return {
        beforeLoad: beforeLoad
    };
});
