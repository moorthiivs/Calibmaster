const { errorHandler } = require("../helpers/error-handler");
const User = require("../models").User;
const instrument = require("../models").instrument;
const UOM = require("../models").UOM;
const db = require("../models");
const instrumentTypeModel = require("../models").instrument_type;
const { Sequelize, Op, QueryTypes } = require("sequelize");

const createInstrumentType = async (req, res, next) => {

    const {
        instrument_id,
        instrument_type_spec,
        instrument_full_name,
        range_minimum,
        range_minimum_uom_id,
        range_maximum,
        range_maximum_uom_id,
        least_count,
        least_count_uom_id,
        size_spec,
        size_spec_uom_id,
        lab_id
    } = req.body;


    if (!instrument_id || !instrument_full_name) {
        let action = "Please fill required fields";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        const newInstrumentType = new instrumentTypeModel({
            instrument_id,
            instrument_type_spec: (instrument_type_spec) ? instrument_type_spec : null,
            instrument_full_name,

            range_minimum: (range_minimum) ? range_minimum : null,
            range_minimum_uom_id: (range_minimum_uom_id) ? range_minimum_uom_id : null,

            range_maximum: (range_maximum) ? range_maximum : null,
            range_maximum_uom_id: (range_maximum_uom_id) ? range_maximum_uom_id : null,

            least_count: (least_count) ? least_count : null,
            least_count_uom_id: (least_count_uom_id) ? least_count_uom_id : null,

            size_spec: (size_spec) ? size_spec : null,
            size_spec_uom_id: (size_spec_uom_id) ? size_spec_uom_id : null,

            created_timestamp: Date.now(),
            created_by_login_name: fetchCreater.name,
            created_by_user_id: req.userId,

            updated_timestamp: Date.now(),
            updated_by_login_name: fetchCreater.name,
            updated_by_user_id: req.userId,

            lab_id
        });

        const result = await newInstrumentType.save();
        return res.status(200).json(result);

    } catch (error) {
        console.log(error);
    }

}

const listInstrumentTypes = async (req, res, next) => {

    try {

        const { lab_id } = req.body;

        if (!lab_id) {
            let action = "Please send all required parameters";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }


        let instrumentTypesList = await db.sequelize.query(
            `SELECT 

            "instrument_types"."instrument_type_id",
            "instrument_types"."instrument_full_name",

	        "instrumentsMain"."instrument_name",

	        "uomTable"."uom_id" AS "uom_pk_id",
	        "uomTable"."uom_name" AS "ins_uom_name",

            "disciplinesTable"."instrument_discipline_id" AS "dis_pk_id",
            "disciplinesTable"."instrument_discipline" AS "ins_dis_name",

	        "groupsTable"."instrument_group_id" AS "group_pk_id",
            "groupsTable"."group_details" AS "ins_group_name"

        FROM 
            "instrument_types"

        INNER JOIN "instruments" AS "instrumentsMain"
            ON "instrument_types"."instrument_id" = "instrumentsMain"."instrument_id"
        
        LEFT OUTER JOIN 
            "UOMs" as "uomTable"
	        ON ("uomTable"."uom_id" = "instrumentsMain"."instrument_uom_id")

        LEFT OUTER JOIN
            "instrument_disciplines" as "disciplinesTable"
            ON ("disciplinesTable"."instrument_discipline_id" = "instrumentsMain"."instrument_discipline_id")

        LEFT OUTER JOIN
            "instrument_groups" as "groupsTable"
            ON "groupsTable"."instrument_group_id" = "instrumentsMain"."instrument_group_id"
        
        WHERE "instrument_types"."lab_id" = ${lab_id}

        ORDER BY
	        "instrument_types"."instrument_type_id" DESC
        `,
            {
                type: QueryTypes.SELECT
            }
        );

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Instrument Type Fetched Successfully!!",
            data: instrumentTypesList
        });
    } catch (err) {
        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const searchByName = async (req, res, next) => {

    const name = req.params.name;

    if (!name) {
        let action = "Search By Name !!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        let result = await db.sequelize.query(
            `SELECT 
            
            "instrument_types"."instrument_type_id",
            "instrument_types"."instrument_full_name",

	        "instrumentsMain"."instrument_name",

	        "uomTable"."uom_id" AS "uom_pk_id",
	        "uomTable"."uom_name" AS "ins_uom_name",

            "disciplinesTable"."instrument_discipline_id" AS "dis_pk_id",
            "disciplinesTable"."instrument_discipline" AS "ins_dis_name",

	        "groupsTable"."instrument_group_id" AS "group_pk_id",
            "groupsTable"."group_details" AS "ins_group_name"

        FROM 
            "instrument_types"

        INNER JOIN "instruments" AS "instrumentsMain"
            ON "instrument_types"."instrument_id" = "instrumentsMain"."instrument_id"
        
        LEFT OUTER JOIN 
            "UOMs" as "uomTable"
	        ON ("uomTable"."uom_id" = "instrumentsMain"."instrument_uom_id")

        LEFT OUTER JOIN
            "instrument_disciplines" as "disciplinesTable"
            ON ("disciplinesTable"."instrument_discipline_id" = "instrumentsMain"."instrument_discipline_id")

        LEFT OUTER JOIN
            "instrument_groups" as "groupsTable"
            ON "groupsTable"."instrument_group_id" = "instrumentsMain"."instrument_group_id"
        
        WHERE LOWER("instrument_types"."instrument_full_name") LIKE LOWER(:search_name)

        ORDER BY
	        "instrument_types"."instrument_type_id" DESC
        `,
            {
                type: QueryTypes.SELECT,
                replacements: { search_name: `${name}%` },
            }
        );

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
        return errorHandler(error, req, res, next);
    }
}

const fetchById = async (req, res, next) => {

    const instrument_type_id = req.params.id;

    if (!instrument_type_id) {
        let action = "Instrument Type Id is required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
    try {

        let result = await instrumentTypeModel.findOne({
            where: { instrument_type_id },
            include: [
                {
                    model: instrument,
                    as: "instrument",
                    attributes: ["instrument_name"]
                },
                "range_minimum_uom",
                "range_maximum_uom",
                "least_count_uom",
                "size_spec_uom"
            ]
        });

        if (!result) {
            let action = "Failed to fetch Instrument Type";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        } else {
            return res.status(200).json({
                msg: true, response: "Instrument Type fetch successfully!!!", result
            });
        }
    } catch (err) {
        console.log(err);
        let action = "Something went wrong, please try again";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const editInstrumentType = async (req, res, next) => {

    const {
        instrument_type_id,
        instrument_id,
        instrument_full_name,
        instrument_type_spec,
        range_minimum,
        range_minimum_uom_id,
        range_maximum,
        range_maximum_uom_id,
        least_count,
        least_count_uom_id,
        size_spec,
        size_spec_uom_id
    } = req.body;

    if (!instrument_type_id || !instrument_id || !instrument_full_name) {
        let action = "Please fill required fields";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        let findinstrumentType = await instrumentTypeModel.findOne({
            where: { instrument_type_id }
        })

        if (!findinstrumentType) {
            let action = "Instrument Not Found";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        await instrumentTypeModel.update(
            {
                instrument_id,
                instrument_type_spec: (instrument_type_spec) ? instrument_type_spec : null,
                instrument_full_name,

                range_minimum: (range_minimum) ? range_minimum : null,
                range_minimum_uom_id: (range_minimum_uom_id) ? range_minimum_uom_id : null,

                range_maximum: (range_maximum) ? range_maximum : null,
                range_maximum_uom_id: (range_maximum_uom_id) ? range_maximum_uom_id : null,

                least_count: (least_count) ? least_count : null,
                least_count_uom_id: (least_count_uom_id) ? least_count_uom_id : null,

                size_spec: (size_spec) ? size_spec : null,
                size_spec_uom_id: (size_spec_uom_id) ? size_spec_uom_id : null,

                created_timestamp: Date.now(),
                created_by_login_name: fetchCreater.name,
                created_by_user_id: req.userId,

                updated_timestamp: Date.now(),
                updated_by_login_name: fetchCreater.name,
                updated_by_user_id: req.userId

            },
            { where: { instrument_type_id } }
        )

        return res.status(200).json({
            msg: true, response: "Record updated successfully!!!"
        });
    } catch (err) {
        let action = "Something went wrong, please try again";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

exports.createInstrumentType = createInstrumentType;
exports.listInstrumentTypes = listInstrumentTypes;
exports.searchByName = searchByName;
exports.fetchById = fetchById;
exports.editInstrumentType = editInstrumentType;