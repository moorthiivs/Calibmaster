const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const { errorHandler } = require("../helpers/error-handler");
const { generate } = require("./Generate-Certificate-Controller");
// const updateDispatchDetails = async (req, res, next) => {

//     if (!req.body || !req.body.items || !req.body.srfId || !req.body.dispatchInfo) {
//         const error = new Error("All Fiels are required.");
//         error.code = 400;
//         return errorHandler(error, req, res, next);
//     }

//     let ids = [];
//     req.body.items.map((v, i) => {
//         ids.push(v.srf_item_id);
//     });

//     const { dispatch_dc, dispatch_date, dispatch_mode, status, labId } = req.body.dispatchInfo;

//     try {
//         await Item.update(
//             {
//                 dispatch_dc, dispatch_date, dispatch_mode, status,
//             },
//             { where: { srf_item_id: ids, rstatus: 1 } }
//         );

//         let items = await Item.findAll({
//             where: { lab_id: labId, rstatus: 1 },
//             include: ["intrument_type"],
//             order: [["srf_item_id", "ASC"]]
//         });

//         return res.status(200).json({
//             status: "SUCCESS",
//             code: 201,
//             message: `SRF Items Dispatch Information Updated Successfully`,
//             items: items
//         });

//     } catch (err) {
//         console.log(err);
//         action = "Internal Server Error!!";
//         const error = new Error(action);
//         error.code = 500;
//         return errorHandler(error, req, res, next);
//     }
// }

const updateDispatchDetails = async (req, res, next) => {
    if (!req.body || !req.body.items || !req.body.srfId || !req.body.dispatchInfo) {
        const error = new Error("All Fields are required.");
        error.code = 400;
        return errorHandler(error, req, res, next);
    }
    const { dispatchInfo, items: itemsToProcess, srfId, report_done_by_empname, report_done_date } = req.body;
    const { dispatch_dc, dispatch_date, dispatch_mode, status, labId } = dispatchInfo;

    console.log(dispatch_date, "dispatch_date");

    // Create an array of item IDs for the bulk update
    const ids = itemsToProcess.map(v => v.srf_item_id);

    try {
        // 2. Perform the bulk database update first.
        await Item.update(
            {
                dispatch_dc, dispatch_date, dispatch_mode, status, report_done_date, report_done_by_empname
            },
            { where: { srf_item_id: ids, rstatus: 1 } }
        );

        // 3. ✅ FIX: Safely loop through items to generate certificates.
        // Use a 'for...of' loop for clarity with async operations.
        for (const item of itemsToProcess) {
            // Create a new request object for each certificate generation.
            // This does NOT overwrite the main 'req' object.
            const certificateRequest = {
                body: {
                    lab_id: item?.lab_id,
                    srf_id: item?.srf_id,
                    srf_item_id: item?.srf_item_id,
                    customer_info: {
                        "srfId": item?.srf_id,
                        "srfNo": item?.srf?.srf_number,
                        "name": item?.intrument_type?.instrument_full_name,
                        "make": item?.make,
                        "model": item?.model,
                        "serialno": item?.serial_no,
                        "idno": item?.identification_details,
                        "companyId": item?.srf?.customer_id
                    },
                    reportGenerateDate: report_done_date,
                    skip_response: true // This flag is crucial
                }
            };
            // Call generate for each item. Assumes 'generate' handles 'skip_response'.
            await generate(certificateRequest, res, next);
        }

        // 4. Fetch the updated items to return in the final response.
        let items = await Item.findAll({
            where: { lab_id: labId, rstatus: 1 },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        // 5. ✅ FIX: Send ONE final success response.
        // This runs only after all updates and certificate generations are complete.
        return res.status(200).json({
            status: "SUCCESS",
            code: 201,
            message: `SRF Items Dispatch Information Updated Successfully`,
            items: items
        });

    } catch (err) {
        console.log(err);
        const action = "Internal Server Error!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}


const updateReportDispatchDetails = async (req, res, next) => {

    if (!req.body || !req.body.items || !req.body.srfId || !req.body.reportDispatchInfo) {
        const error = new Error("All Fiels are required.");
        error.code = 400;
        return errorHandler(error, req, res, next);
    }

    let ids = [];
    req.body.items.map((v, i) => {
        ids.push(v.srf_item_id);
    });

    const { report_dispatch_date, report_dispatch_mode, status, labId } = req.body.reportDispatchInfo;

    try {
        await Item.update(
            {
                report_dispatch_date, report_dispatch_mode, status,
            },
            { where: { srf_item_id: ids, rstatus: 1 } }
        );

        let items = await Item.findAll({
            where: { lab_id: labId, rstatus: 1 },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 201,
            message: `SRF Items Dispatch Information Updated Successfully`,
            items: items
        });

    } catch (err) {
        console.log(err);
        const error = new Error("Internal Server Error!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const updatePaymentDetails = async (req, res, next) => {

    if (!req.body || !req.body.items || !req.body.srfId || !req.body.paymentInfo) {
        const error = new Error("All Fiels are required.");
        error.code = 400;
        return errorHandler(error, req, res, next);
    }

    let ids = [];
    req.body.items.map((v, i) => {
        ids.push(v.srf_item_id);
    });

    const { status, labId } = req.body.paymentInfo;

    try {
        await Item.update(
            {
                status,
            },
            { where: { srf_item_id: ids, rstatus: 1 } }
        );

        let items = await Item.findAll({
            where: { lab_id: labId, rstatus: 1 },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 201,
            message: `SRF Items Dispatch Information Updated Successfully`,
            items: items
        });

    } catch (err) {
        console.log(err);
        const error = new Error("Internal Server Error!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

exports.updateDispatchDetails = updateDispatchDetails;
exports.updateReportDispatchDetails = updateReportDispatchDetails;
exports.updatePaymentDetails = updatePaymentDetails;
