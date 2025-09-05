/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/***************************************************************************************
 ** Copyright (c) 1998-2024 Softype, Inc.
** Ventus Infotech Private Limited,
** All Rights Reserved.
**
** This software is the confidential and proprietary information of Softype, Inc. ("Confidential Information").
** You shall not disclose such Confidential Information and shall use it only in accordance with the terms of
** the license agreement you entered into with Softype.
**
** @Author      : Jidnesh Madhavi   
** @Dated       : 22-04-2025
** @Version     : 2.1
** @Description : to restrict eccn item on item record
***************************************************************************************/

define(['N/record', 'N/url', 'N/search', 'N/email', 'N/runtime','N/https','N/task'], function(record, url, search, email, runtime,https,task) {
    function beforeLoad(context){
        var currentRec = context.newRecord;
        var recType = currentRec.type;
        var recId = currentRec.id;

        if(context.type == "edit" || context.type =="view"){
            const source = currentRec.getValue({ fieldId: 'source' });
            log.debug('Source', source);
            const userId = runtime.getCurrentUser().id;
            log.debug("User Id",userId);

            if (source === "Web Services") {
                log.debug('Skipping ECCN checks for Arena-created item');
                return;
            }

            var eccnCheckBox = currentRec.getValue({fieldId: "custitem_st_eccn_compliance_"});
            log.debug('eccnCheckBox',eccnCheckBox);
            const userRoleId = runtime.getCurrentUser().role;
            log.debug("User Role ID", userRoleId);

            const countryCodeMap = {
                'india': 'IN',
                'china': 'CN',
                'usa': 'US',
                'united states': 'US',
                'mexico': 'MX'
            };
            

            var allowedCountries = currentRec.getValue({ fieldId: "custitem_st_allow_country_visibility_"});
            var allowedCountriesArray = allowedCountries.split(";");
            log.debug(allowedCountriesArray,allowedCountries);

            var employeeSearch = search.lookupFields({
                type: 'employee',
                id: userId,
                columns: ['custentity_is_eccn_compliance_employee_','custentity_st_working_in_geography_']
            });
            log.debug("employeeSearch",employeeSearch);

            var country = employeeSearch.custentity_st_working_in_geography_;
            var geography = employeeSearch.custentity_st_working_in_geography_;
            log.debug("geography",geography)
            var geographyCode = '';

            if (Array.isArray(geography) && geography.length > 0) {
                var countryName = geography[0].text.toLowerCase();
                geographyCode = countryCodeMap[countryName] || geography[0].text;
            } else {
                geographyCode = '';
            }

            log.debug("Country Name", geography[0]?.text);
            log.debug("Country Code", geographyCode);

        // log.debug(allowedCountriesArray.includes(geographyCode),)
            if (eccnCheckBox === true) {
                var isEccnUser = employeeSearch.custentity_is_eccn_compliance_employee_;
                log.debug("contains",allowedCountriesArray.includes(geographyCode))
                if ((isEccnUser === true && allowedCountriesArray.includes(geographyCode)) || userRoleId == "3") {
                    log.debug('ECCN access condition', 'TRUE: Employee is ECCN-compliant and country is allowed');
                } else {
                    throw `Error - Page not found`
                    
                }
            }else if(geographyCode == "CN" && allowedCountriesArray.includes("US") ){
                throw `Error - Page not found`
            }
        }
    }
    return{
        beforeLoad:beforeLoad
    }
})