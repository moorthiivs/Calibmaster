const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const customer = require("../models").customer;
const Lab = require("../models").Lab;
const { Op } = require("sequelize");
const { errorHandler } = require("../helpers/error-handler");

const searchBySerialNo = async (req, res, next) => {

    const { labId, serial_no } = req.body;

    if (!labId) {
        let action = "Lab id is required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        let items = await Item.findAll({
            where: {
                serial_no: {
                    [Op.iLike]: `${serial_no}%`
                },
                lab_id: labId, rstatus: 1
            },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "SRF Items Fetched Successfully",
            items
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong, please try again");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const searchByDispatchNo = async (req, res, next) => {

    const { labId, dispatch_number } = req.body;

    if (!labId) {
        let action = "Lab Id Is Required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        let items = await Item.findAll({
            where: {
                dispatch_dc: {
                    [Op.iLike]: `${dispatch_number}%`
                },
                lab_id: labId,
                rstatus: 1
            },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "SRF Items Fetched Successfully",
            items
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong, please try again");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const searchByIdentificationDetails = async (req, res, next) => {

    const { labId, identification_details } = req.body;

    if (!labId) {
        let action = "Lab Id Is Required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        let items = await Item.findAll({
            where: {
                identification_details: {
                    [Op.iLike]: `${identification_details}%`
                },
                lab_id: labId, rstatus: 1
            },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "SRF Items Fetched Successfully",
            items
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong, please try again");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const SearchBySRFItems = async (req, res, next) => {

    if (!req.body || !req.body.labId || !req.body.srf_ids) {
        const error = new Error("Invalid Request Params!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    const { labId, srf_ids } = req.body;

    let srfs, items;

    try {

        srfs = await SRF.findAll({
            where: {
                lab_id: labId,
                srf_id: srf_ids
            },
            include: [
                {
                    model: Lab,
                    as: "lab",
                    attributes: {
                        exclude: [
                            "created_timestamp",
                            "created_by_login_name",
                            "created_by_user_id",
                            "updated_timestamp",
                            "updated_by_login_name",
                            "updated_by_user_id",

                            "address1",
                            "address2",
                            "address3",

                            "contact_email",
                            "lab_id",
                            "lab_name",

                            "contact_number1",
                            "contact_number2",

                            "rstatus",

                            "brand_logo_filename",
                            "brand_logo_mime_type",
                            "brand_logo",

                            "other_logo1_image_filename",
                            "other_logo1_image_mime_type",
                            "other_logo1_image",

                            "other_logo2_image_filename",
                            "other_logo2_image_mime_type",
                            "other_logo2_image"
                        ],
                    },
                },
                {
                    model: customer,
                    as: "customer",
                    attributes: ["customer_name"]
                }
            ]
        });

        items = await Item.findAll({
            where: {
                lab_id: labId,
                srf_id: srf_ids,
                rstatus: 1
            },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Error On Getting Parent SRF");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    return res.status(200).json({
        status: "SUCCESS",
        code: 200,
        message: "SRF Items Fetched Successfully",
        srfs,
        items
    });
}

const searchByInwardNo = async (req, res, next) => {

    const { labId, inward_no } = req.body;

    if (!labId) {
        let action = "Lab Id Is Required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        let items = await Item.findAll({
            where: {
                inward_no: {
                    [Op.iLike]: `${inward_no}%`
                },
                lab_id: labId, rstatus: 1
            },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "SRF Items Fetched Successfully",
            items
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong, please try again");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}
exports.searchBySerialNo = searchBySerialNo;
exports.searchByDispatchNo = searchByDispatchNo;
exports.searchByIdentificationDetails = searchByIdentificationDetails;
exports.SearchBySRFItems = SearchBySRFItems;
exports.searchByInwardNo = searchByInwardNo;