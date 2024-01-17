const MasterTable = require("../models").master_from_table;
const TableDesign = require("../models").first_from_table;

const { errorHandler } = require("../helpers/error-handler");

const create = async (req, res, next) => {

    try {

        const {
            lab_id, mainArray,
            ulr_number, validity, traceability, calibration_procedure,
            temperature, humidity, atmospheric_pressure,
        } = req.body;

        // TODO: Create Parent-Table Id
        const newMasterTable = new MasterTable({
            lab_id: lab_id,
            calibration_procedure: calibration_procedure,
            ulr_number, validity, traceability, temperature, humidity,
            atmospheric_pressure
        });
        const result = await newMasterTable.save();

        if (result) {

            for (let i = 0; i < mainArray?.length; i++) {

                delete mainArray[i].master_design_procedure_id; // TODO: If want to revert, then just remove the line 

                mainArray[i].master_from_table_id = await result.master_from_table_id;
                mainArray[i].unique_id = new Date().getTime();

                const newTableDesign = new TableDesign(mainArray[i]);
                const res = await newTableDesign.save();
                console.log(res);
            }
            return res.json({
                code: 200,
                msg: "First From Table added successfully",
                result
            });
        } else {
            return res.json({
                code: 500,
                msg: "Failed to added First From Table",
            });
        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "---";
        return errorHandler(error, req, res, next);
    }
}

const list = async (req, res, next) => {

    try {

        const { lab_id } = req.body;

        const masterTables = await MasterTable.findAll({
            where: {
                lab_id: lab_id
            }
        });
        return res.json(masterTables);
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

const fetch = async (req, res, next) => {

    try {
        const { master_from_table_id, lab_id } = req.body;

        const masterTable = await MasterTable.findOne({
            where: {
                lab_id,
                master_from_table_id
            },
        });

        const tableDesign = await TableDesign.findAll({
            where: { master_from_table_id },
            order: [
                ['fromId', 'ASC'],
            ],
        });

        return res.json({ masterTable, tableDesign });
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

module.exports = {
    create,
    list,
    fetch
}