const { errorHandler } = require("../helpers/error-handler");
const User = require("../models").User;
const uomModel = require("../models").UOM;
const { Op } = require("sequelize");

const createUom = async (req, res, next) => {

    const {
        uom_name,
        uom_kindofquantity,
        uom_printsysmbol,
        uom_casesensitive,
        uom_caseinsensitive
    } = req.body;

    if (!uom_name || !uom_kindofquantity || !uom_printsysmbol) {
        let action = "All fields are required";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/create";
        return errorHandler(error, req, res, next);
    }

    try {
        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        const newUom = new uomModel({
            uom_name,
            uom_kindofquantity,
            uom_printsysmbol,

            uom_casesensitive,
            uom_caseinsensitive,

            created_timestamp: Date.now(),
            created_by_login_name: fetchCreater.name,
            created_by_user_id: req.userId,

            updated_timestamp: Date.now(),
            updated_by_login_name: fetchCreater.name,
            updated_by_user_id: req.userId
        })

        const result = await newUom.save();

        res.status(200).json({ msg: true, result });
    } catch (err) {
        console.log(err);
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/create";
        return errorHandler(error, req, res, next);
    }
}

const findUom = async (req, res, next) => {

    const uom_id = req.params.id;

    if (!uom_id) {
        let action = "UOM id is required";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/edit";
        return errorHandler(error, req, res, next);
    }

    try {

        let result = await uomModel.findOne({
            attributes: ['uom_id', 'uom_name', 'uom_kindofquantity', 'uom_printsysmbol', 'uom_casesensitive', 'uom_caseinsensitive'],
            where: { uom_id }
        })

        if (!result) {
            let action = "Failed to fetch UOM";
            const error = new Error(action);
            error.code = 500;
            error.path = "/api/uom/edit";
            return errorHandler(error, req, res, next);
        } else {

            return res.status(200).json({
                msg: true, response: "UOM fetch successfully!!!", result
            });
        }

    } catch (err) {
        let action = "Something went wrong, please try again";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/edit";
        return errorHandler(error, req, res, next);
    }
}

const editUom = async (req, res, next) => {

    const {
        uom_id,
        uom_name,
        uom_kindofquantity,
        uom_printsysmbol,
        uom_casesensitive,
        uom_caseinsensitive
    } = req.body;

    if (!uom_id || !uom_name || !uom_kindofquantity || !uom_printsysmbol) {
        let action = "UOM id is required";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/edit";
        return errorHandler(error, req, res, next);
    }

    try {

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        let findUOM = await uomModel.findOne({
            where: { uom_id }
        })

        if (findUOM) {
            await uomModel.update(
                {
                    uom_name,
                    uom_kindofquantity,
                    uom_printsysmbol,

                    uom_casesensitive,
                    uom_caseinsensitive,

                    updated_timestamp: Date.now(),
                    updated_by_login_name: fetchCreater.name,
                    updated_by_user_id: req.userId
                },
                { where: { uom_id } }
            )
            return res.status(200).json({
                msg: true, response: "Record updated successfully!!!"
            });
        } else {
            let action = "Failed to update UOM";
            const error = new Error(action);
            error.code = 500;
            error.path = "/api/uom/edit";
            return errorHandler(error, req, res, next);
        }

    } catch (err) {
        let action = "Something went wrong, please try again";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/edit";
        return errorHandler(error, req, res, next);
    }
}

const listUom = async (req, res, next) => {

    try {
        let uomList = await uomModel.findAll({
            attributes: ['uom_id', 'uom_name', 'uom_kindofquantity', 'uom_printsysmbol', 'uom_casesensitive', 'uom_caseinsensitive'],
            // where: { 'created_by_user_id': req.userId },
            order: [
                ['uom_id', 'DESC'],
            ]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Uom List Fetched Successfully!!",
            data: uomList
        });

    } catch (err) {

        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/list";
        return errorHandler(error, req, res, next);
    }
}

const searchByName = async (req, res, next) => {

    const name = req.params.name;

    if (!name) {
        let action = "Search By Name !!!";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/searchByName/:name";
        return errorHandler(error, req, res, next);
    }

    try {
        let result = await uomModel.findAll({
            attributes: ['uom_id', 'uom_name', 'uom_kindofquantity', 'uom_printsysmbol', 'uom_casesensitive', 'uom_caseinsensitive'],
            where: {
                uom_name: {
                    [Op.iLike]: `${name}%`
                }
            }
        })

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Uom List Fetched Successfully!!",
            data: result
        });
    } catch (err) {
        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/list";
        return errorHandler(error, req, res, next);
    }
}

const searchByKindOfQuantity = async (req, res, next) => {

    const name = req.params.name;

    if (!name) {
        let action = "Search By Name !!!";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/searchByName/:name";
        return errorHandler(error, req, res, next);
    }

    try {
        let result = await uomModel.findAll({
            attributes: ['uom_id', 'uom_name', 'uom_kindofquantity', 'uom_printsysmbol', 'uom_casesensitive', 'uom_caseinsensitive'],
            where: {
                uom_kindofquantity: {
                    [Op.iLike]: `${name}%`
                }
            }
        })

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Uom List Fetched Successfully!!",
            data: result
        });
    } catch (err) {
        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/list";
        return errorHandler(error, req, res, next);
    }
}

exports.createUom = createUom;
exports.editUom = editUom;
exports.listUom = listUom;
exports.findUom = findUom;
exports.searchByName = searchByName;
exports.searchByKindOfQuantity = searchByKindOfQuantity;