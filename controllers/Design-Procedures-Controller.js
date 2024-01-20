const MasterTable = require("../models").master_design_procedure;
const Dynamicdesign = require("../models").design_procedure;

const { errorHandler } = require("../helpers/error-handler");

const create = async (req, res, next) => {

    try {

        const {
            lab_id, instrument_type_id, mainArray,
            calibration_procedure, ref_std,
            validity, traceability,
            temperature, humidity, atmospheric_pressure
        } = req.body;

        // TODO: Create Parent-Table Id
        const newMasterTable = new MasterTable({
            lab_id: lab_id,
            instrument_type_id,
            calibration_procedure, ref_std,
            validity, traceability,
            temperature, humidity, atmospheric_pressure
        });
        const result = await newMasterTable.save();

        if (result) {

            for (let i = 0; i < mainArray?.length; i++) {

                mainArray[i].master_design_procedure_id = await result.master_design_procedure_id;
                mainArray[i].unique_id = new Date().getTime();
                mainArray[i].calibration_procedure = calibration_procedure;

                const newTableDesign = new Dynamicdesign(mainArray[i]);
                await newTableDesign.save();
            }
            return res.json(result);
        } else {
            return res.json({ msg: false });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
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
        const { master_design_procedure_id, lab_id } = req.body;

        const masterTable = await MasterTable.findOne({
            where: {
                lab_id,
                master_design_procedure_id
            },
        });

        const tableDesign = await Dynamicdesign.findAll({
            where: { master_design_procedure_id },
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

const update = async (req, res, next) => {

    try {

        const {
            master_design_procedure_id, lab_id, instrument_type_id,
            calibration_procedure, ref_std,
            validity, traceability,
            temperature, humidity, atmospheric_pressure,
            mainArray
        } = req.body;

        const masterTableUpdate = await MasterTable.update(
            {
                calibration_procedure, ref_std, instrument_type_id,
                validity, traceability,
                temperature, humidity, atmospheric_pressure
            },
            { where: { master_design_procedure_id, lab_id } }
        );

        for (let i = 0; i < mainArray.length; i++) {

            const {
                design_procedure_id, fromId,
                rows, columns,
                header_types, header_texts, second_row_headers, cell_texts
            } = mainArray[i];

            const response = await Dynamicdesign.update(
                { rows, columns, header_types, header_texts, second_row_headers, cell_texts },
                { where: { design_procedure_id } }
            );
            console.log({ log: `${design_procedure_id} is updated ${response}` });
        }

        return res.json({
            msg: "Dynamic Tables Updated Successfully",
            mainArray,
            masterTableUpdate
        });

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
    fetch,
    update
}