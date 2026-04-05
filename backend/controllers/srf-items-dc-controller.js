const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const { errorHandler } = require("../helpers/error-handler");

const updateSRFItemsDCStatus = async (req, res, next) => {

    try {

        const { lab_id, srf_id, srf_item_id, dc_status } = req.body;

        const query = await Item.findOne({
            where: { lab_id: lab_id, srf_id: srf_id, srf_item_id: srf_item_id }
        });

        if (query) {
            await query.update({
                dc_status
            });
        }

        let items;
        try {
            items = await Item.findAll({
                where: { srf_id: srf_id, rstatus: 1 },
                include: ["intrument_type"],
            });
        } catch (err) {
            console.log(err);
            const action = "Internal Server Error!!!";
            const error = new Error(action);
            error.code = 500;
            error.path = "DC-Status-Update";
            return errorHandler(error, req, res, next);
        }

        return res.status(201).json({
            status: "SUCCESS",
            code: 201,
            message: "SRF Item DC Status Update Successfully",
            items
        });

    } catch (err) {
        console.log(error);
        const error = new Error("Failed to Update SRF Item DC Status");
        error.code = 500;
        error.path = "SRF Item DC Status Update";
        return errorHandler(error, req, res, next);
    }
}

const getSRFITEMDCStatus = async (req, res, next) => {

    try {

        const { lab_id, srf_id, srf_item_id } = req.body;

        const item = await Item.findOne({
            where: { lab_id: lab_id, srf_id: srf_id, srf_item_id: srf_item_id }
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "SRF Item Fetched Successfully",
            item: item
        });

    } catch (err) {
        console.log(error);
        const error = new Error("Failed to Fetch SRF Item");
        error.code = 500;
        error.path = "SRF Item DC Status Update";
        return errorHandler(error, req, res, next);
    }
}

const updateBulkSRFItemsDCStatus = async (req, res, next) => {

    try {

        if (!req.body.lab_id || !req.body.srf_id || !req.body.items || !req.body.dc_status) {
            const error = new Error("All Fiels are required.");
            error.code = 400;
            return errorHandler(error, req, res, next);
        }

        const { lab_id, srf_id, items, dc_status } = req.body;

        let ids = [];
        items?.map((v, i) => {
            ids?.push(v?.srf_item_id);
        });

        const query = await Item.update(
            { dc_status },
            { where: { srf_item_id: ids, lab_id, srf_id, rstatus: 1 } }
        );

        return res.status(201).json({
            status: "SUCCESS",
            code: 201,
            message: "SRF Item DC Status Update Successfully",
            query
        });

    } catch (err) {
        console.log(error);
        const error = new Error("Failed to Update SRF Item DC Status");
        error.code = 500;
        error.path = "SRF Item DC Status Update";
        return errorHandler(error, req, res, next);
    }
}

exports.updateSRFItemsDCStatus = updateSRFItemsDCStatus;
exports.getSRFITEMDCStatus = getSRFITEMDCStatus;
exports.updateBulkSRFItemsDCStatus = updateBulkSRFItemsDCStatus;