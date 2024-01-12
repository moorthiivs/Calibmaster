const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const { errorHandler } = require("../helpers/error-handler");

const updateDispatchDetails = async (req, res, next) => {

    if (!req.body || !req.body.items || !req.body.srfId || !req.body.dispatchInfo) {
        const error = new Error("All Fiels are required.");
        error.code = 400;
        return errorHandler(error, req, res, next);
    }

    let ids = [];
    req.body.items.map((v, i) => {
        ids.push(v.srf_item_id);
    });

    const { dispatch_dc, dispatch_date, dispatch_mode, status, labId } = req.body.dispatchInfo;

    try {
        await Item.update(
            {
                dispatch_dc, dispatch_date, dispatch_mode, status,
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
        action = "Internal Server Error!!";
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
