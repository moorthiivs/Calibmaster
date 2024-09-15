var fs = require('fs');
const MasterTable = require("../models").master_design_procedure;
const Dynamicdesign = require("../models").design_procedure;

const MasterResultTable = require("../models").master_result_table;
const resultTable = require("../models").result_table;

const UncertaintyMasterParameter = require("../models").uncertainty_master_parameter;
const procedureUncertainties = require("../models").procedure_uncertainties;

const { errorHandler } = require("../helpers/error-handler");

function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};
    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }
    response.type = matches[1];
    response.data = Buffer.from(matches[2], 'base64');

    return response;
}

function StoreProcedureImages(images, fromId) {
    let imgFileNames = images.map((imageData) => {
        try {
            const isExists = fs.existsSync(`public/procedure_images/${imageData}`);
            if (isExists) return imageData;
            let imgFileName = '';
            const DecodeImg = decodeBase64Image(imageData);
            const imageBuffer = DecodeImg.data;
            const fileExtension = DecodeImg.type.slice(6);
            imgFileName = Math.floor(Math.random() * 9999999) + '-' + fromId + "." + fileExtension;
            fs.writeFileSync("public/procedure_images/" + imgFileName, imageBuffer, 'utf8');
            return imgFileName;
        }
        catch (err) {
            console.error(err)
        }
    })
    return imgFileNames;
}

const create = async (req, res, next) => {

    try {

        const {
            lab_id, instrument_type_id, mainArray,
            calibration_procedure, ref_std,
            validity, traceability,
            temperature, humidity, atmospheric_pressure, master_list_equipments, remarks,
            uncertainty_master_parameters
        } = req.body;

        // TODO: Create Parent-Table Id
        const newMasterTable = new MasterTable({
            lab_id: lab_id,
            instrument_type_id,
            unique_id: new Date().getTime(),
            calibration_procedure, ref_std,
            validity, traceability,
            temperature, humidity, atmospheric_pressure,
            master_list_equipments, remarks
        });
        const result = await newMasterTable.save();

        if (result) {

            // uncertainty_master_parameters?.map((item) => {
            //     item.master_design_procedure_id = result?.master_design_procedure_id;
            //     return item;
            // });
            // const procedure_uncertainties_insert_query = await procedureUncertainties.bulkCreate(uncertainty_master_parameters);

            for (let i = 0; i < mainArray?.length; i++) {

                mainArray[i].master_design_procedure_id = await result.master_design_procedure_id;
                mainArray[i].calibration_procedure = calibration_procedure;
                // mainArray[i].cell_texts = ["a", "b", "c"];
                mainArray[i].procedure_image_filename = StoreProcedureImages(mainArray[i].procedure_image_filename, mainArray[i].fromId);
            }
            await Dynamicdesign.bulkCreate(mainArray);

            return res.json(mainArray);
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

const findAllList = async (req, res, next) => {

    try {

        const { lab_id } = req.body;

        const masterTables = await MasterTable.findAll({
            where: {
                lab_id: lab_id,
            },
            include: ["instrument_type"],
            order: [
                ['master_design_procedure_id', 'ASC']
            ],
        });
        return res.json(masterTables);
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

const list = async (req, res, next) => {

    try {

        const { lab_id, instrument_type_id, srf_id, srf_item_id } = req.body;

        if (!lab_id || !instrument_type_id || !srf_id || !srf_item_id) {
            let action = "All fields are required";
            const error = new Error(action);
            error.code = 500;
            error.path = "--";
            return errorHandler(error, req, res, next);
        }

        const existingResultMaster = await MasterResultTable.findOne({
            where: { srf_id, srf_item_id, lab_id },
        });

        const definedProcedures = await MasterTable.findAll({
            where: {
                lab_id: lab_id,
                instrument_type_id: instrument_type_id
            },
            include: ["instrument_type"],
            order: [
                ['master_design_procedure_id', 'ASC']
            ],
        });

        if (existingResultMaster) {
            return res.json({
                definedProcedures: definedProcedures,
                existingResultMaster,
                is_exist: true
            });
        } else {
            return res.json({
                definedProcedures: definedProcedures,
                is_exist: false
            });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

const fetch = async (req, res, next) => {

    try {
        const {
            master_design_procedure_id, lab_id,
            srf_id, srf_item_id,
        } = req.body;

        const ifExistResultMasterTable = await MasterResultTable.findOne({
            where: {
                srf_id, srf_item_id,
                lab_id
            },
        });

        if (ifExistResultMasterTable) {

            const masterTable = await MasterResultTable.findOne({
                where: {
                    srf_id, srf_item_id,
                    lab_id
                },
            });

            const tableDesign = await resultTable.findAll({
                where: { master_result_table_id: masterTable.master_result_table_id },
                order: [
                    ['fromId', 'ASC'],
                ],
            });

            return res.json({ masterTable, tableDesign, ifExistResultMasterTable: true });

        } else {

            const masterTable = await MasterTable.findOne({
                where: {
                    lab_id,
                    master_design_procedure_id
                },
                include: "procedure_uncertainties"
            });

            const { procedure_uncertainties } = masterTable;

            const uncertainty_master_parameter_id_array = [];

            procedure_uncertainties.map((item) => {
                uncertainty_master_parameter_id_array.push(item.uncertainty_master_parameter_id);
            });

            const uncertainty_master_parameter_query = await UncertaintyMasterParameter.findAll({
                where: {
                    uncertainty_master_parameter_id: uncertainty_master_parameter_id_array
                },
            });

            const tableDesign = await Dynamicdesign.findAll({
                where: { master_design_procedure_id },
                order: [
                    ['fromId', 'ASC'],
                ],
            });

            return res.json({
                masterTable, tableDesign,
                uncertainty_master_parameter_query,
                ifExistResultMasterTable: false
            });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

const viewDefinedProcedures = async (req, res, next) => {

    try {
        const {
            master_design_procedure_id, lab_id,
        } = req.body;

        const masterTable = await MasterTable.findOne({
            where: {
                lab_id,
                master_design_procedure_id
            },
            include: "procedure_uncertainties"
        });

        const { procedure_uncertainties } = masterTable;

        const uncertainty_master_parameter_id_array = [];

        procedure_uncertainties.map((item) => {
            uncertainty_master_parameter_id_array.push(item.uncertainty_master_parameter_id);
        });

        const uncertainty_master_parameter_query = await UncertaintyMasterParameter.findAll({
            where: {
                uncertainty_master_parameter_id: uncertainty_master_parameter_id_array
            },
        });

        const tableDesign = await Dynamicdesign.findAll({
            where: { master_design_procedure_id },
            order: [
                ['fromId', 'ASC'],
            ],
        });

        return res.json({
            masterTable,
            tableDesign,
            ifExistResultMasterTable: false,
            uncertainty_master_parameter_query
        });

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
            mainArray, master_list_equipments, remarks, uncertainty_master_parameters
        } = req.body;

        const masterTableUpdate = await MasterTable.update(
            {
                calibration_procedure, ref_std, instrument_type_id,
                validity, traceability,
                temperature, humidity, atmospheric_pressure, master_list_equipments, remarks
            },
            { where: { master_design_procedure_id, lab_id } }
        );

        for (let i = 0; i < mainArray.length; i++) {

            let {
                design_procedure_id, fromId,
                rows, columns,
                header_types, header_texts, second_row_headers, cell_texts, print_on_certifcate, procedure_image_filename
            } = mainArray[i];

            procedure_image_filename = StoreProcedureImages(procedure_image_filename, fromId);

            if (design_procedure_id) {
                if (mainArray[i]?.delete) {
                    await Dynamicdesign.destroy({
                        where: { design_procedure_id }
                    });
                } else {
                    const response = await Dynamicdesign.update(
                        { rows, columns, header_types, header_texts, second_row_headers, cell_texts, print_on_certifcate, procedure_image_filename },
                        { where: { design_procedure_id } }
                    );
                    console.log({ log: `${design_procedure_id} is updated ${response}` });
                }
            } else {
                mainArray[i].master_design_procedure_id = master_design_procedure_id;
                mainArray[i].calibration_procedure = calibration_procedure;

                const newTableDesign = new Dynamicdesign(mainArray[i]);
                await newTableDesign.save();
            }
        }

        // *** 1st Delete rows with master_design_procedure_id ***
        await procedureUncertainties.destroy({
            where: { master_design_procedure_id: master_design_procedure_id }
        });

        // *** 2nd Add New Records with master_design_procedure_id, uncertainty_master_parameter_id ***
        uncertainty_master_parameters?.map((item) => {
            item.master_design_procedure_id = master_design_procedure_id;
            return item;
        });

        const procedure_uncertainties_insert_query = await procedureUncertainties.bulkCreate(uncertainty_master_parameters);

        return res.json({
            msg: "Dynamic Tables Updated Successfully",
            mainArray,
            masterTableUpdate,
            procedure_uncertainties_insert_query
        });
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

// ! Test Controllers
const create_procedure_uncertainties = async (req, res, next) => {

    try {

        const query_1 = new procedureUncertainties({
            master_design_procedure_id: 1,
            uncertainty_master_parameter_id: 1
        });

        const query_2 = new procedureUncertainties({
            master_design_procedure_id: 1,
            uncertainty_master_parameter_id: 2
        });

        return res.json({ query_1, query_2 })

    } catch (error) {
        console.log(error);
    }
}

const find_uncertainty_master_parameters = async (req, res, next) => {

    try {
        const result = await MasterTable.findOne({
            include: "procedure_uncertainties"
        });

        const { procedure_uncertainties } = result;

        const uncertainty_master_parameter_id_array = [];

        procedure_uncertainties.map((item) => {
            uncertainty_master_parameter_id_array.push(item.uncertainty_master_parameter_id);
        });

        const uncertainty_master_parameter_query = await UncertaintyMasterParameter.findAll({
            where: {
                uncertainty_master_parameter_id: uncertainty_master_parameter_id_array
            },
        });

        return res.json(uncertainty_master_parameter_query);
    } catch (error) {
        console.log(error);
    }
}

const edit_uncertainty_master_parameters = async (req, res, next) => {

    try {

        // *** 1st Delete rows with master_design_procedure_id ***
        // const delete_query = await procedureUncertainties.destroy({
        //     where: {
        //         master_design_procedure_id: 1
        //     }
        // });
        // return res.json(delete_query);


        // *** 2nd Add New Records with master_design_procedure_id, uncertainty_master_parameter_id ***
        const master_design_procedure_id = 1;

        const data = [
            { uncertainty_master_parameter_id: 1 },
            { uncertainty_master_parameter_id: 2 }
        ];

        data?.map((item) => {
            item.master_design_procedure_id = master_design_procedure_id;
            return item;
        });

        const insert_query = await procedureUncertainties.bulkCreate(data);

        return res.json(insert_query);

    } catch (error) {
        console.log(error);
    }
}

const duplicateDefinedProcedures = async (req, res, next) => {

    try {
        const {
            master_design_procedure_id, lab_id,
        } = req.body;

        const masterTable = await MasterTable.findOne({
            where: {
                lab_id,
                master_design_procedure_id
            },
            include: "procedure_uncertainties"
        });

        const tableDesign = await Dynamicdesign.findAll({
            where: { master_design_procedure_id },
            order: [
                ['fromId', 'ASC'],
            ],
        });

        const { atmospheric_pressure, calibration_procedure, humidity, instrument_type_id, ref_std, remarks, temperature, traceability, validity, master_list_equipments } = masterTable;

        const mainArray = tableDesign.map(tableData => {
            const { fromId, rows, columns, header_types, header_texts, second_row_headers, cell_texts, table_type, print_on_certifcate, procedure_image_filename } = tableData;
            return {
                fromId,
                rows,
                columns,
                header_types,
                header_texts,
                second_row_headers,
                cell_texts,
                table_type,
                unique_id: new Date().getTime(),
                print_on_certifcate,
                procedure_image_filename
            }
        })

        // TODO: Create Parent-Table Id
        const newMasterTable = new MasterTable({
            lab_id: lab_id,
            instrument_type_id,
            unique_id: new Date().getTime(),
            calibration_procedure: `Copy of ${calibration_procedure}`,
            ref_std,
            validity,
            traceability,
            temperature, humidity,
            atmospheric_pressure,
            master_list_equipments,
            remarks
        });
        const result = await newMasterTable.save();

        if (result) {
            for (let i = 0; i < mainArray?.length; i++) {

                mainArray[i].master_design_procedure_id = await result.master_design_procedure_id;
                mainArray[i].calibration_procedure = calibration_procedure;
            }
            await Dynamicdesign.bulkCreate(mainArray);

            return res.json({ procedureName: calibration_procedure });
        } else {
            return res.json({ msg: false });
        }
    }
    catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

module.exports = {
    create,
    findAllList,
    list,
    fetch,
    viewDefinedProcedures,
    duplicateDefinedProcedures,
    update,
    create_procedure_uncertainties,
    find_uncertainty_master_parameters,
    edit_uncertainty_master_parameters
}