const MasterTable = require("../models").master_result_table;
const Dynamicdesign = require("../models").result_table;


const { ProcedureResult } = require('../models');

const { errorHandler } = require("../helpers/error-handler");
const { where } = require("sequelize");

const create = async (req, res, next) => {

    try {

        const {
            lab_id, instrument_type_id, srf_id, srf_item_id, master_design_procedure_id,
            calibration_procedure, ref_std,
            validity, traceability,
            temperature, humidity, atmospheric_pressure, frequency, ulr_number,
            master_list_equipments, remarks, calibrated_employee_id, approved_employee_id,
            userid, ExceljsonData, PrintonCertificate, FileName, cmeid,
            ObservationCertificate,
            selectedFormatdoc,
            WitnessbyData
        } = req.body;


        const ifExistsMasterTable = await MasterTable.findOne({
            where: { srf_id, srf_item_id }
        });

        if (ifExistsMasterTable) {

            const masterTableUpdate = await MasterTable.update(
                {
                    calibration_procedure, ref_std, instrument_type_id,
                    validity, traceability,
                    temperature, humidity, atmospheric_pressure, frequency, ulr_number,
                    master_list_equipments, remarks, calibrated_employee_id, approved_employee_id,
                    document_format: selectedFormatdoc, witnessed_by: WitnessbyData
                },
                { where: { lab_id, srf_id, srf_item_id, } }
            );

            // save excel json here

            if (ExceljsonData) {
                const { sheets, merges, styles, decimalPrecision
                } = ExceljsonData
                const ProcedureResultTable = await ProcedureResult.update(
                    {
                        ExcelData: sheets,
                        Mergedcell: merges,
                        Styles: styles,
                        decimalPrecision,
                        updatedby: userid,
                        print_on_certificate: PrintonCertificate,
                        print_on_observation: ObservationCertificate || null
                    },
                    { where: { labid: lab_id, srf_id, srf_item_id, } }
                )
            }


            return res.json({ msg: "Result Tables Updated Successfully", masterTableUpdate });



        } else {

            const { sheets, merges, styles, decimalPrecision
            } = ExceljsonData

            const newMasterTable = new MasterTable({
                lab_id, instrument_type_id, srf_id, srf_item_id,
                master_design_procedure_id,
                calibration_procedure, ref_std,
                unique_id: new Date().getTime(),
                validity, traceability,
                temperature, humidity, atmospheric_pressure, frequency, ulr_number,
                master_list_equipments, remarks, calibrated_employee_id, approved_employee_id,
                document_format: selectedFormatdoc, WitnessbyData
            });
            const result = await newMasterTable.save();
            if (result) {

                // save excel json here

                const newProcedureResultTable = new ProcedureResult({
                    FileName,
                    ExcelData: sheets,
                    Mergedcell: merges,
                    Styles: styles,
                    decimalPrecision,
                    srf_id,
                    srf_item_id,
                    labid: lab_id,
                    print_on_certificate: PrintonCertificate,
                    print_on_observation: ObservationCertificate || null,
                    createdby: userid,
                    master_design_procedure_id,
                    cmeid
                });
                const result = await newProcedureResultTable.save();

                return res.json({ msg: "Result Tables Added Successfully" });
            } else {
                const error = new Error("Failed To Add Result Tables");
                error.code = 500;
                error.path = "--";
                return errorHandler(error, req, res, next);
            }
        }






    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "--";
        return errorHandler(error, req, res, next);
    }
}

const list = async (req, res, next) => {

    try {

        const { lab_id } = req.body;

        const masterTables = await MasterTable.findAll({
            where: {
                lab_id: lab_id
            },
            order: [
                ['master_result_table_id', 'ASC'],
            ],
        });
        return res.json(masterTables);
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "--";
        return errorHandler(error, req, res, next);
    }
}

const fetch = async (req, res, next) => {

    try {
        const { master_result_table_id, lab_id } = req.body;

        const masterTable = await MasterTable.findOne({
            where: {
                master_result_table_id,
                lab_id
            },
        });

        const tableDesign = await Dynamicdesign.findAll({
            where: { master_result_table_id },
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
            master_result_table_id, lab_id, instrument_type_id,
            calibration_procedure, ref_std,
            validity, traceability,
            temperature, humidity, atmospheric_pressure, frequency, ulr_number,
            master_list_equipments, remarks, calibrated_employee_id, approved_employee_id,
            mainArray
        } = req.body;

        const masterTableUpdate = await MasterTable.update(
            {
                calibration_procedure, ref_std, instrument_type_id,
                validity, traceability,
                temperature, humidity, atmospheric_pressure, frequency, ulr_number,
                master_list_equipments, remarks, calibrated_employee_id, approved_employee_id
            },
            { where: { master_result_table_id, lab_id } }
        );

        for (let i = 0; i < mainArray.length; i++) {

            const {
                result_table_id,
                rows, columns,
                fromId,
                header_types, header_texts, second_row_headers, cell_texts
            } = mainArray[i];

            const response = await Dynamicdesign.update(
                { rows, columns, header_types, header_texts, second_row_headers, cell_texts },
                { where: { result_table_id } }
            );
            console.log(response);
        }
        return res.json({ msg: "Result Tables Updated Successfully", masterTableUpdate });
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