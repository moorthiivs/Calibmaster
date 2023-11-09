const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
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
        let action = "Something went wrong, please try again";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

}

exports.searchBySerialNo = searchBySerialNo;