const { errorHandler } = require("../helpers/error-handler");
const User = require("../models").User;
const uomModel = require("../models").UOM;
const { Op } = require("sequelize");
const { sequelize } = require("../models");

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

    const normalizedName = uom_name.trim().toLowerCase();
    const normalizedQuantity = uom_kindofquantity.trim().toLowerCase();
    const normalizedSymbol = uom_printsysmbol.trim().toLowerCase();

    try {

        // let duplicateUom = await uomModel.findAll({
        //     where: {
        //         uom_name: { [Op.iLike]: `${uom_name.trim()}` },
        //     },
        // });

        // if (duplicateUom.length) {
        //     let action = "UOM Name already exists";
        //     const error = new Error(action);
        //     error.code = 500;
        //     return errorHandler(error, req, res, next);
        // }
        const duplicateUom = await uomModel.findOne({
            where: {
                [Op.or]: [
                    sequelize.where(
                        sequelize.fn("lower", sequelize.col("uom_name")),
                        normalizedName
                    ),
                    sequelize.where(
                        sequelize.fn("lower", sequelize.col("uom_kindofquantity")),
                        normalizedQuantity
                    ),
                    sequelize.where(
                        sequelize.fn("lower", sequelize.col("uom_printsysmbol")),
                        normalizedSymbol
                    )
                ]
            }
        });

        if (duplicateUom) {
            const error = new Error(
                `UOM already exists (${duplicateUom.uom_name} - ${duplicateUom.uom_printsysmbol})`
            );
            error.code = 409; // Conflict
            error.path = "/api/uom/create";
            return errorHandler(error, req, res, next);
        }

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

        let duplicateUom = await uomModel.findAll({
            where: {
                uom_name: { [Op.iLike]: `${uom_name.trim()}` },
                uom_id: {
                    [Op.not]: uom_id,
                },
            },
        });

        if (duplicateUom.length) {
            let action = "UOM Name already exists";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

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

const deleteUom = async (req, res, next) => {
    const uom_id = req.params.id;

    if (!uom_id) {
        const error = new Error("UOM id is required");
        error.code = 400;
        error.path = "/api/uom/delete";
        return errorHandler(error, req, res, next);
    }

    try {
        const uom = await uomModel.findOne({ where: { uom_id } });

        if (!uom) {
            const error = new Error("UOM not found");
            error.code = 404;
            error.path = "/api/uom/delete";
            return errorHandler(error, req, res, next);
        }

        await uomModel.destroy({ where: { uom_id } });

        return res.status(200).json({
            msg: true,
            response: "UOM deleted successfully!"
        });
    } catch (err) {
        // DB-agnostic foreign key constraint detection:
        // - Sequelize wraps FK errors as ForeignKeyConstraintError
        // - PostgreSQL native code: 23503
        // - MySQL native code: 1451
        // - SQLite native code: SQLITE_CONSTRAINT (with 'FOREIGN KEY' in message)
        const isForeignKeyError =
            err.name === 'SequelizeForeignKeyConstraintError' ||
            err.original?.code === '23503' ||   // PostgreSQL
            err.original?.code === 1451 ||       // MySQL
            (err.original?.code === 'SQLITE_CONSTRAINT' && err.original?.message?.toLowerCase().includes('foreign key'));

        if (isForeignKeyError) {
            return res.status(409).json({
                msg: false,
                code: 409,
                response: `Cannot delete this UOM — it is still assigned to one or more instruments. Please reassign or remove those instruments first.`
            });
        }

        console.log(err);
        const error = new Error("Something went wrong, please try again");
        error.code = 500;
        error.path = "/api/uom/delete";
        return errorHandler(error, req, res, next);
    }
};

exports.createUom = createUom;
exports.editUom = editUom;
exports.listUom = listUom;
exports.findUom = findUom;
exports.deleteUom = deleteUom;
exports.searchByName = searchByName;
exports.searchByKindOfQuantity = searchByKindOfQuantity;