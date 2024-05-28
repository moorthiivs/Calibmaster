// *** Import 3rd Party Packages ***
// const puppeteer = require('puppeteer');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
// *** Import Models ***
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const instrument = require("../models").instrument;
const instrumentTypeModel = require("../models").instrument_type;
const MasterListEquipment = require("../models").MasterListEquipment;
const request = require("request");
const { errorHandler } = require("../helpers/error-handler");

const verniercaliper = async (req, res, next) => {

    const {
        ulr_number, validity, traceability,
        labId, srf_item_id, master_list_equipment_id,
        calibration_procedure, temperature, humidity,
        calibration, uncertainty,
        remark_1, remark_2, remark_3, remark_4, remark_5,
        calibrated_by, approved_by
    } = req.body;

    if (
        !ulr_number || !validity || !traceability
        || !labId || !srf_item_id || !master_list_equipment_id
        || !calibration_procedure || !temperature || !humidity
        || !calibration || !uncertainty
    ) {
        const error = new Error("All fields are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    if (!remark_1 || !remark_2) {
        const error = new Error("Minimum 2 remarks are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    // return res.json({ valided: true })

    const certificate_number = new Date().getTime();

    // Query SRF-Items by srf_item_id
    let item = await Item.findOne({
        where: { lab_id: labId, srf_item_id, rstatus: 1 },
        include: [
            {
                model: instrumentTypeModel,
                as: "intrument_type",
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
            },
            {
                model: SRF,
                as: "srf",
                include: [
                    "customer"
                ]
            }
        ],
        order: [["srf_item_id", "ASC"]]
    });
    // return res.json({ item });

    if (!item) {
        let action = "SRF-Item is not available";
        const error = new Error(action);
        error.code = 501;
        return errorHandler(error, req, res, next);
    }

    // Set First table data
    const customer_address = item?.srf?.customer?.address1;
    const date_of_issue = item?.srf?.issue_date;
    const received_date = item?.srf?.customer_dc_date;
    let cal_date = item?.certificate_date;
    let due_date = item?.calibration_due_date;
    const condition = item?.remarks;

    if (cal_date != null) {
        cal_date = new Date(cal_date);
        cal_date = `${new Date(cal_date).getDate() - 1}/${new Date(cal_date).getMonth() + 1}/${new Date(cal_date).getFullYear()}`
    } else {
        cal_date = "--";
    }

    if (due_date != null) {
        due_date = new Date(due_date);
        due_date = `${new Date(due_date).getDate() - 1}/${new Date(due_date).getMonth() + 1}/${new Date(due_date).getFullYear()}`
    } else {
        due_date = "--";
    }

    // Set duc details table data
    const description = item?.intrument_type?.instrument_full_name;
    const make = item?.make;
    const slNo = item?.serial_no;
    const idNo = item?.serial_no;
    const range = `${item?.intrument_type?.range_minimum} - ${item?.intrument_type?.range_maximum} ${item?.intrument_type?.range_maximum_uom?.uom_printsysmbol}`
    const lc = `${item?.intrument_type?.least_count} ${item?.intrument_type?.least_count_uom?.uom_printsysmbol}`;

    // Query Master List Equipmentsby master_list_equipment_id
    let masterListEquipment = await MasterListEquipment.findOne({
        where: { master_list_equipment_id }
    });

    if (!masterListEquipment) {
        let action = "Master Equipment is not available";
        const error = new Error(action);
        error.code = 501;
        return errorHandler(error, req, res, next);
    }

    // Set standards/Master details table data
    const masterDescription = masterListEquipment.equipment_name;
    const masterMake = masterListEquipment.equipment_make_or_nodel;
    const masterSlNo = masterListEquipment.equipment_serial_no;
    const masterCertificateNo = masterListEquipment.calibration_certificate_no;
    const masterValidity = validity;
    const masterTraceability = traceability;

    // return res.json({ masterListEquipment });
    const { BACKEND_SERVER } = process?.env;

    try {
        const EjsFilePath = path.resolve(__dirname, '../views/verniercaliper.ejs');

        let browser = await puppeteer.launch();
        const [page] = await browser.pages();

        ejs.renderFile(EjsFilePath,
            {
                certificate_number, ulr_number, customer_address,
                date_of_issue, received_date, cal_date, due_date, condition,
                description, make, slNo, idNo, range, lc,
                masterDescription, masterMake, masterSlNo, masterCertificateNo, masterValidity, masterTraceability,
                calibration_procedure, temperature, humidity,
                calibration, uncertainty,
                remark_1, remark_2, remark_3, remark_4, remark_5,
                calibrated_by, approved_by, BACKEND_SERVER
            },
            async (err, data) => {
                if (err) {
                    console.log(err);
                    const error = new Error("Failed to read certificate");
                    error.code = 500;
                    return errorHandler(error, req, res, next);
                } else {
                    await page.setContent(data);

                    const todayDate = new Date().getTime();

                    const pdfn = await page.pdf({
                        path: `${path.join(__dirname, '../public/certificate', todayDate + ".pdf")}`,
                        printBackground: true,
                        format: "A4",
                        displayHeaderFooter: true,
                        headerTemplate: `
                            <style>#header, #footer { padding: 0 !important; }</style>
                            <div style="width: 100%; background-color: red;">
                                <h1 style="font-size: 20px; text-align: center; margin-bottom: 0px;">
                                    DEMP CALIBRATION SERVICES
                                </h1>
                                <P style="font-size: 10px; text-align: center; margin-top: 6px; 
                                    margin-bottom: 4px;">
                                    25/50 Kalighat Area 15th Street, Shyama Prasad Mukherjee Kolkata - 600 0100
                                </P>
                                <P style="font-size: 10px; text-align: center; margin-top: 0px;
                                    margin-bottom: 4px;">
                                    Mobile: 9804806699/55480 18000/ 91767 40455 / Website: www.dempcalibration.com
                                </P>
                                 <P style="font-size: 10px; text-align: center; margin-top: 0px;
                                    margin-bottom: 4px;">
                                    Email: democalibrationservices@gmail.com / democalibrationservices@yahoo.com / calibrationdemo2016@gmail.com
                                </P>
                                <h5 style="font-size: 15px; text-align: center; margin-top: 0px;
                                    background-color: black;">
                                    CERTIFICATE OF CALIBRATION
                                </h5>
                            </div>
                        `,
                        footerTemplate: `
                            <style>#header, #footer { padding: 0 !important; }</style>
                            <div style="border-top: solid 1px #bbb; width: 100%; font-size: 11px;
                                padding: 0px 5px 0; color: #bbb; position: relative;">
                                <div style="color:black; display: flex; padding-bottom: 10px">
                                    <p style="margin-bottom: 0px;">
                                        The Calibration Certificate is valid only for the condition of the received DUC at the 
                                        time under the stated condition of calibration. The calibration certificate shall not be 
                                        reproduced in full without written approval of TCS Head.  DUC: Device Under Calibration.
                                        Calibration Measurement are traceable to SI Units through unbroken chain of calibration
                                        from competent laboratory.
                                    </p>
                                </div>
                            </div>
                        `,
                        margin: { top: '180px', bottom: '100px' }
                    });

                    await browser.close();

                    const pdfURL = path.join(__dirname, '../public/certificate', todayDate + ".pdf");
                    return res.sendFile(pdfURL);
                }
            });
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const generate = async (req, res, next) => {

    const {
        ulr_number, validity, traceability,
        labId, srf_item_id, master_list_equipment_id,
        calibration_procedure, temperature, humidity,
        calibration, uncertainty,
        remark_1, remark_2, remark_3, remark_4, remark_5,
        calibrated_by, approved_by,
        repeatability, eccentricity
    } = req.body;

    if (
        !ulr_number || !validity || !traceability
        || !labId || !srf_item_id || !master_list_equipment_id
        || !calibration_procedure || !temperature || !humidity
        || !calibration || !uncertainty || !repeatability || !eccentricity
    ) {
        const error = new Error("All fields are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    if (!remark_1 || !remark_2) {
        const error = new Error("Minimum 2 remarks are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    // return res.json({ valided: true })

    const certificate_number = new Date().getTime();

    // Query SRF-Items by srf_item_id
    let item = await Item.findOne({
        where: { lab_id: labId, srf_item_id, rstatus: 1 },
        include: [
            {
                model: instrumentTypeModel,
                as: "intrument_type",
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
            },
            {
                model: SRF,
                as: "srf",
                include: [
                    "customer"
                ]
            }
        ],
        order: [["srf_item_id", "ASC"]]
    });
    // return res.json({ item });

    if (!item) {
        let action = "SRF-Item is not available";
        const error = new Error(action);
        error.code = 501;
        return errorHandler(error, req, res, next);
    }

    // Set First table data
    const customer_address = item?.srf?.customer?.address1;
    const date_of_issue = item?.srf?.issue_date;
    const received_date = item?.srf?.customer_dc_date;
    let cal_date = item?.certificate_date;
    let due_date = item?.calibration_due_date;
    const condition = item?.remarks;

    if (cal_date != null) {
        cal_date = new Date(cal_date);
        cal_date = `${new Date(cal_date).getDate() - 1}/${new Date(cal_date).getMonth() + 1}/${new Date(cal_date).getFullYear()}`
    } else {
        cal_date = "--";
    }

    if (due_date != null) {
        due_date = new Date(due_date);
        due_date = `${new Date(due_date).getDate() - 1}/${new Date(due_date).getMonth() + 1}/${new Date(due_date).getFullYear()}`
    } else {
        due_date = "--";
    }

    // Set duc details table data
    const description = item?.intrument_type?.instrument_full_name;
    const make = item?.make;
    const slNo = item?.serial_no;
    const idNo = item?.serial_no;
    const range = `${item?.intrument_type?.range_minimum} - ${item?.intrument_type?.range_maximum} ${item?.intrument_type?.range_maximum_uom?.uom_printsysmbol}`
    const lc = `${item?.intrument_type?.least_count} ${item?.intrument_type?.least_count_uom?.uom_printsysmbol}`;

    // Query Master List Equipmentsby master_list_equipment_id
    let masterListEquipment = await MasterListEquipment.findOne({
        where: { master_list_equipment_id }
    });

    if (!masterListEquipment) {
        let action = "Master Equipment is not available";
        const error = new Error(action);
        error.code = 501;
        return errorHandler(error, req, res, next);
    }

    // Set standards/Master details table data
    const masterDescription = masterListEquipment.equipment_name;
    const masterMake = masterListEquipment.equipment_make_or_nodel;
    const masterSlNo = masterListEquipment.equipment_serial_no;
    const masterCertificateNo = masterListEquipment.calibration_certificate_no;
    const masterValidity = validity;
    const masterTraceability = traceability;

    // return res.json({ masterListEquipment });
    const { BACKEND_SERVER } = process?.env;

    try {
        const EjsFilePath = path.resolve(__dirname, '../views/certificate.ejs');

        let browser = await puppeteer.launch();
        const [page] = await browser.pages();

        ejs.renderFile(EjsFilePath,
            {
                certificate_number, ulr_number, customer_address,
                date_of_issue, received_date, cal_date, due_date, condition,
                description, make, slNo, idNo, range, lc,
                masterDescription, masterMake, masterSlNo, masterCertificateNo, masterValidity, masterTraceability,
                calibration_procedure, temperature, humidity,
                calibration, uncertainty,
                remark_1, remark_2, remark_3, remark_4, remark_5,
                calibrated_by, approved_by, BACKEND_SERVER, repeatability, eccentricity
            },
            async (err, data) => {
                if (err) {
                    console.log(err);
                    const error = new Error("Failed to read certificate");
                    error.code = 500;
                    return errorHandler(error, req, res, next);
                } else {
                    await page.setContent(data);

                    const todayDate = new Date().getTime();

                    const pdfn = await page.pdf({
                        path: `${path.join(__dirname, '../public/certificate', todayDate + ".pdf")}`,
                        printBackground: true,
                        format: "A4",
                        displayHeaderFooter: true,
                        headerTemplate: `
                            <style>#header, #footer { padding: 0 !important; }</style>
                            <div style="width: 100%; background-color: red;">
                                <h1 style="font-size: 20px; text-align: center; margin-bottom: 0px;">
                                    DEMP CALIBRATION SERVICES
                                </h1>
                                <P style="font-size: 10px; text-align: center; margin-top: 6px; 
                                    margin-bottom: 4px;">
                                    25/50 Kalighat Area 15th Street, Shyama Prasad Mukherjee Kolkata - 600 0100
                                </P>
                                <P style="font-size: 10px; text-align: center; margin-top: 0px;
                                    margin-bottom: 4px;">
                                    Mobile: 9804806699/55480 18000/ 91767 40455 / Website: www.dempcalibration.com
                                </P>
                                 <P style="font-size: 10px; text-align: center; margin-top: 0px;
                                    margin-bottom: 4px;">
                                    Email: democalibrationservices@gmail.com / democalibrationservices@yahoo.com / calibrationdemo2016@gmail.com
                                </P>
                                <h5 style="font-size: 15px; text-align: center; margin-top: 0px;
                                    background-color: black;">
                                    CERTIFICATE OF CALIBRATION
                                </h5>
                            </div>
                        `,
                        footerTemplate: `
                            <style>#header, #footer { padding: 0 !important; }</style>
                            <div style="border-top: solid 1px #bbb; width: 100%; font-size: 11px;
                                padding: 0px 5px 0; color: #bbb; position: relative;">
                                <div style="color:black; display: flex; padding-bottom: 10px">
                                    <p style="margin-bottom: 0px;">
                                        The Calibration Certificate is valid only for the condition of the received DUC at the 
                                        time under the stated condition of calibration. The calibration certificate shall not be 
                                        reproduced in full without written approval of TCS Head.  DUC: Device Under Calibration.
                                        Calibration Measurement are traceable to SI Units through unbroken chain of calibration
                                        from competent laboratory.
                                    </p>
                                </div>
                            </div>
                        `,
                        margin: { top: '180px', bottom: '100px' }
                    });

                    await browser.close();

                    const pdfURL = path.join(__dirname, '../public/certificate', todayDate + ".pdf");
                    return res.sendFile(pdfURL);
                }
            });
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

exports.generate = generate;
exports.verniercaliper = verniercaliper;