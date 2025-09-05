/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/https', 'N/url', 'N/runtime', 'N/currentRecord'], function (https, url, runtime, currentRecord) {

    function pageInit(context) {
        var currentRec = context.currentRecord;
        const userRoleId = runtime.getCurrentUser().role;
        var customForm = currentRec.getValue({ fieldId: 'customform' });

        // Fetch ECCN check status from Suitelet
        fetchECCNStatus().then(function (isEccnCheck) {
            if (isEccnCheck === false && customForm == "162" && userRoleId != "3") { //for po
                alert("Error selecting this form");
                currentRec.setValue({ fieldId: "customform", value: "98" });
            }
            if (isEccnCheck === false && customForm == "163" && userRoleId != "3") { //for SO
                alert("Error selecting this form");
                currentRec.setValue({ fieldId: "customform", value: "156" });
            }
            // if (isEccnCheck === false && customForm == "160" && userRoleId != "3") { //For Dropship PO
            //     alert("Error selecting this form");
            //     currentRec.setValue({ fieldId: "customform", value: "98" });
            // }
        }).catch(function (error) {
            console.log("Failed to fetch ECCN status: ", error);
        });
    }

    function fieldChanged(context) {
        var currentRec = context.currentRecord;
        if (context.fieldId == "customform") {
            const userRoleId = runtime.getCurrentUser().role;
            var customForm = currentRec.getValue({ fieldId: 'customform' });

            fetchECCNStatus().then(function (isEccnCheck) {
                if (isEccnCheck === false && customForm == "162" && userRoleId != "3") { //for po
                    alert("Error selecting this form");
                    currentRec.setValue({ fieldId: "customform", value: "98" });
                }
                if (isEccnCheck === false && customForm == "163" && userRoleId != "3") { //for SO
                    alert("Error selecting this form");
                    currentRec.setValue({ fieldId: "customform", value: "156" });
                }
                // if (isEccnCheck === false && customForm == "160" && userRoleId != "3") { //For Dropship PO
                //     alert("Error selecting this form");
                //     currentRec.setValue({ fieldId: "customform", value: "98" });
                // }
            }).catch(function (error) {
                console.log("Failed to fetch ECCN status: ", error);
            });
        }
    }

    function fetchECCNStatus() {
        return new Promise(function (resolve, reject) {
            try {
                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_softype_sl_form_restriction',  // 🔵 Update this with your Suitelet script id
                    deploymentId: 'customdeploy_softype_sl_form_restriction', // 🔵 Update deployment id
                    returnExternalUrl: false
                });

                https.get.promise({ url: suiteletUrl })
                    .then(function (response) {
                        var body = JSON.parse(response.body);
                        if (body && body.isEccnCompliant !== undefined) {
                            resolve(body.isEccnCompliant);
                        } else {
                            resolve(false); // Assume false if error
                        }
                    })
                    .catch(function (err) {
                        console.log("Error fetching ECCN: ", err.message);
                        resolve(false);
                    });

            } catch (e) {
                console.log("Error preparing ECCN fetch: ", e.message);
                resolve(false);
            }
        });
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});
