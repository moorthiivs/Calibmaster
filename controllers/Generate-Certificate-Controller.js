// *** Import Dev Packages ***
var pdfMake = require("pdfmake/build/pdfmake");
var pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake.vfs;
var fs = require("fs");
const path = require('path');
const imageDataURI = require('image-data-uri');
const nodemailer = require("nodemailer");

// *** Import Models ***
const Lab = require("../models").Lab;
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const instrument = require("../models").instrument;
const instrumentTypeModel = require("../models").instrument_type;
const MasterListEquipment = require("../models").MasterListEquipment;
const Certificate = require("../models").Certificate;

// *** Result Table Models ***
const masterResultTable = require("../models").master_result_table;
const resultTable = require("../models").result_table;

// Error Handler
const { errorHandler } = require("../helpers/error-handler");

async function imageToBuffer(imagePath) {
    try {
        return await imageDataURI.encodeFromFile(imagePath)
            .then(dataURI => dataURI)
    } catch (error) {
        console.log(error);
        throw error;
    }
}

// *** Helper function ***
const sendMail = async (srfItemsQuery, filePath) => {

    try {

        const { lab, srf } = srfItemsQuery;

        // Connecting to the STMP Server
        const transporter = nodemailer.createTransport({
            name: "CalibMaster",
            host: lab?.email_smtp_server_host,
            port: lab?.email_smtp_server_port,
            secure: true,
            auth: {
                user: lab?.sender_email,
                pass: lab?.sender_password
            }
        });

        const info = await transporter.sendMail({
            from: lab?.sender_email,
            to: srf?.contact_email,
            subject: "Certificate Mail",
            text: "Please find the certificate on the attachment",
            html: "<b>Please find the certificate on the attachment</b>",
            priority: "high",
            attachments: [
                {
                    path: filePath,
                    filename: 'certificate.pdf',
                    contentType: "application/pdf",
                }
            ]
        });

        console.log(info);
        return { msg: "Certificate Mail Send Successfully", status: true }
    } catch (error) {
        console.log(error);
        return { msg: "Failed to send Certificate Mail", status: true }
    }
}

const footerLongText = "The Calibration Certificate is valid only for the condition of the received DUC at the time under the stated condition of calibration. The calibration certificate shall not be reproduced in full without written approval of TCS Head. DUC: Device Under Calibration. Calibration Measurement are traceable to SI Units through unbroken chain of calibration from competent laboratory.";

const generate = async (req, res, next) => {

    try {

        const { lab_id, srf_id, srf_item_id } = req.body;

        const certificate_number = new Date().getTime();

        // ***  Query SRF-Items by srf_item_id *** 
        let item = await Item.findOne({
            where: { lab_id: lab_id, srf_item_id, rstatus: 1 },
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

        // ***  Set First table data *** 
        const customer_address = item?.srf?.customer?.address1;
        const date_of_issue = (item?.srf?.issue_date) ? item?.srf?.issue_date : "--";
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

        // ***  Set duc details table data *** 
        const description = item?.intrument_type?.instrument_full_name;
        const make = item?.make;
        const slNo = item?.serial_no;
        const idNo = item?.identification_details;
        const range = `${item?.intrument_type?.range_minimum} - ${item?.intrument_type?.range_maximum} ${item?.intrument_type?.range_maximum_uom?.uom_printsysmbol}`
        const lc = `${item?.intrument_type?.least_count} ${item?.intrument_type?.least_count_uom?.uom_printsysmbol}`;

        // ***  Query Master Result List  *** 
        let masterResult = await masterResultTable.findOne({
            where: { lab_id, srf_id, srf_item_id }
        });
        // return res.json(masterResult);

        if (!masterResult) {
            let action = "Master Result is not available";
            const error = new Error(action);
            error.code = 501;
            return errorHandler(error, req, res, next);
        }

        // ***  Query Master List Equipmentsby master_list_equipment_id *** 
        let masterListEquipment = await MasterListEquipment.findOne();
        // return res.json(masterListEquipment);

        if (!masterListEquipment) {
            let action = "Master Equipment is not available";
            const error = new Error(action);
            error.code = 501;
            return errorHandler(error, req, res, next);
        }

        // *** Set standards details table data *** 
        const ulr_number = masterResult?.ulr_number;
        const calibration_procedure = masterResult?.calibration_procedure;
        const ref_std = masterResult?.ref_std;
        const temperature = masterResult?.temperature;
        const humidity = masterResult?.humidity;
        const remarks = masterResult?.remarks;

        let validity = ""
        if (masterListEquipment?.calibration_valid_upto) {
            const vDate = masterListEquipment?.calibration_valid_upto;
            validity = new Date(vDate);
            validity = `${new Date(vDate).getDate() - 1}/${new Date(vDate).getMonth() + 1}/${new Date(vDate).getFullYear()}`;
        }
        // return res.json(validity);

        const masterDescription = masterListEquipment?.remark;
        const masterMake = masterListEquipment?.make;
        const masterSlNo = masterListEquipment?.master_list_equipment_id;
        const masterCertificateNo = masterListEquipment?.calibration_certificate_no;
        const masterValidity = validity;
        const masterTraceability = masterListEquipment?.traceability;

        // *** Find Lab Logos ***
        const lab = await Lab.findOne({
            attributes: [
                'lab_name',
                'address1', 'address2', 'address3',
                'city', 'state', 'country', 'pincode',
                'lab_website', 'contact_email', 'contact_number1', 'contact_number2',
                'brand_logo_filename'
            ],
            where: { lab_id },
        });
        // return res.json(lab);

        // *** Find Results ***
        const tableDesignArr = await resultTable.findAll({
            where: { master_result_table_id: masterResult?.master_result_table_id },
            order: [
                ['fromId', 'ASC'],
            ],
        });

        const bigEyeObj = [];

        for (let x = 0; x < tableDesignArr.length; x++) {

            const Columns = tableDesignArr[x].columns;
            const FirstHeaderTexts = tableDesignArr[x].header_texts;
            const secondHeaderTexts = tableDesignArr[x].second_row_headers;

            const headerTypes = tableDesignArr[x].header_types;
            const cellTexts = tableDesignArr[x].cell_texts;

            const widthsArr = [];
            for (let i = 0; i < Columns; i++) {
                widthsArr.push(60);
            }

            for (let i = 0; i < cellTexts.length; i++) {
                for (let j = 0; j < headerTypes.length; j++) {
                    if (headerTypes[j] == "Formula") {
                        const mainObj = cellTexts[i][j];
                        const textObj = { text: mainObj.val }
                        Object.assign(mainObj, textObj);
                    }
                }
            }

            cellTexts.unshift(FirstHeaderTexts, secondHeaderTexts);

            const eachObj = {
                style: 'eachTableStyle',
                color: '#444',
                table: {
                    widths: widthsArr,
                    headerRows: 2,
                    keepWithHeaderRows: 1,
                    body: cellTexts
                },
                // pageBreak: "after"
            }

            bigEyeObj.push(eachObj);
        }
        // return res.json(bigEyeObj);

        // *** Seal & Logos area ***
        const sealLogoPath = path.resolve(__dirname, `../public/images/${lab.brand_logo_filename}`);
        const sealBuffer = await imageToBuffer(sealLogoPath);

        const sign1LogoPath = path.resolve(__dirname, '../public/logos/sign-1.png');
        const sign1LogoBuffer = await imageToBuffer(sign1LogoPath);

        const sign2LogoPath = path.resolve(__dirname, '../public/logos/sign-2.png');
        const sign2LogoBuffer = await imageToBuffer(sign2LogoPath);

        const calibrated_by = "--";
        const approved_by = "--";

        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [20, 130, 20, 90],
            header: [
                {
                    text: `${lab.lab_name}`,
                    alignment: 'center', fontSize: 18, bold: true,
                    margin: [0, 10, 0, 0],
                },
                {
                    text: `${lab.address1}, ${lab.state}, ${lab.city}-${lab.pincode},`,
                    alignment: 'center', fontSize: 12,
                    margin: [0, 5, 0, 0],
                },
                {
                    text: `Mobile: ${lab.contact_number1}/ Website: ${lab.lab_website}`,
                    alignment: 'center', fontSize: 12,
                    margin: [0, 2, 0, 0],
                },
                {
                    text: `Email: ${lab.contact_email}`,
                    alignment: 'center', fontSize: 10,
                    margin: [0, 2, 0, 0],
                },
                {
                    text: 'CERTIFICATE OF CALIBRATION',
                    alignment: 'center', fontSize: 18, bold: true,
                    margin: [0, 5, 0, 0],
                }
            ],
            footer: function (currentPage, pageCount) {
                return [
                    {
                        text: footerLongText,
                        alignment: 'left',
                        margin: [10, 0, 10, 10]
                    },
                    { text: currentPage.toString() + ' of ' + pageCount, alignment: 'center' }
                ]
            },
            content: [
                {
                    style: 'firstTable',
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [
                                { text: `CERTIFICATE NUMBER: ${certificate_number}` },
                                { text: `DATE OF ISSUE: ${date_of_issue}` },
                            ],
                            [
                                { text: `ULR NUMBER: ${ulr_number}` },
                                { text: `RECEIVED DATE: ${received_date}` },
                            ],
                            [
                                { text: `CUSTOMER ADDRESS: ${customer_address}`, rowSpan: 4, },
                                { text: `CAL.DATE: ${cal_date}` },
                            ],
                            [
                                {},
                                { text: `DUE.DATE: ${due_date}` },
                            ],
                            [
                                {},
                                { text: `CONDITION: ${condition}` },
                            ],
                            [
                                {},
                                { text: 'CALIBRATED AT: LAB' },
                            ]
                        ]
                    }
                },
                {
                    style: '2ndTable',
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [
                                { text: 'DUC DETAILS', alignment: 'center' },
                                { text: 'STANDARD DETAILS', alignment: 'center' }
                            ]
                        ]
                    }
                },
                {
                    style: '3rdTable',
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [
                                { text: 'DESCRIPTION: Weigh Device' },
                                { text: `DESCRIPTION: ${masterDescription}` },
                            ],
                            [
                                { text: `MAKE: ${make}` },
                                { text: `MAKE: ${masterMake}` },
                            ],
                            [
                                { text: `SL.NO: ${slNo}` },
                                { text: `SL.NO: ${masterSlNo}` }
                            ],
                            [
                                { text: `ID.NO: ${idNo}` },
                                { text: `CERTIFICATE.NO: ${masterCertificateNo}` }
                            ],
                            [
                                { text: `RANGE: ${range}` },
                                { text: `VALIDITY: ${masterValidity}` }
                            ],
                            [
                                { text: `L.C: ${lc}` },
                                { text: `TRACEABILITY: ${masterTraceability}` }
                            ],
                        ]
                    }
                },
                {
                    style: '4thTable',
                    table: {
                        widths: ['*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: `CALIBRATION PROCEDURE & REF.STD: ${calibration_procedure} & ${ref_std}` }
                            ]
                        ]
                    }
                },
                {
                    style: '5thTable',
                    table: {
                        widths: ['*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: 'ENVIRONMENTAL CONDITION:' }
                            ]
                        ]
                    }
                },
                {
                    style: '6thTable',
                    table: {
                        widths: ['*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: `TEMPERATURE (°C): ${temperature}` }
                            ]
                        ]
                    }
                },
                {
                    style: '7thTable',
                    table: {
                        widths: ['*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: `HUMIDITY (RH %): ${humidity}` }
                            ]
                        ]
                    }
                },
                {
                    style: '8thTable',
                    table: {
                        widths: ['*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: 'CALIBRATION RESULT ( All Values are in mm ):' }
                            ]
                        ]
                    }
                },
                bigEyeObj,
                {
                    style: 'firstTable', pageBreak: 'before',
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [
                                { text: `CERTIFICATE NUMBER: ${certificate_number}` },
                                { text: `DATE OF ISSUE: ${date_of_issue}` },
                            ]

                        ]
                    }
                },
                { text: 'REMARKS:', margin: [0, 10, 0, 5] },
                {
                    style: 'remarksList',
                    ol: remarks
                },
                {
                    alignment: 'justify',
                    columns: [
                        {
                            ul: [
                                {
                                    image: sign1LogoBuffer,
                                    width: 50,
                                    margin: [0, 0, 0, 0],
                                    alignment: 'center'
                                },
                                { text: `${calibrated_by}`, listType: 'none' },
                                { text: 'Calibration Engineer', listType: 'none' },
                                { text: 'Calibrated By', listType: 'none' }
                            ],
                            alignment: 'center'
                        },
                        {
                            image: sealBuffer,
                            width: 80,
                            margin: [0, 0, 0, 0],
                            alignment: 'center'
                        },
                        {
                            ul: [
                                {
                                    image: sign2LogoBuffer,
                                    width: 50,
                                    margin: [0, 0, 0, 0],
                                    alignment: 'center'
                                },
                                { text: `${approved_by}`, listType: 'none' },
                                { text: 'Technical manager', listType: 'none' },
                                { text: 'Approved by', listType: 'none' }
                            ],
                            alignment: 'center'
                        },
                    ],
                    margin: [0, 30, 0, 5],
                },
            ],
            pageBreakBefore: function (currentNode) {
                return currentNode.style && currentNode.style.indexOf('pdf-pagebreak-before') > -1;
            },
            defaultStyle: {
                columnGap: 20
            },
            styles: {
                mainTable: {
                    alignment: 'center'
                },
                signatureTable: {
                    alignment: 'center'
                },
                calibrationTable: {
                    alignment: 'center'
                },
                uncertainityTable: {
                    alignment: 'center'
                },
                repeatabilityTable: {
                    alignment: 'center'
                },
                eccentricityTable: {
                    alignment: 'center'
                },
                eachTableStyle: {
                    margin: [0, 0, 0, 10]
                }
            }
        }

        const pdfDocGenerator = pdfMake.createPdf(docDefinition, {});

        pdfDocGenerator.getBuffer(async function (buffer) {

            const todayDate = new Date().getTime();
            const fileName = `certificate-${todayDate}.pdf`;

            fs.writeFileSync(`./certificates/${fileName}`, buffer);

            const newCertificate = new Certificate({
                fileName: fileName,
                rstatus: 1,
                srfitemId: srf_item_id
            });
            const result = await newCertificate.save();
            // return console.log(result);

            let srfItemsQuery = await Item.findOne({
                where: { srf_item_id },
                attributes: [
                    "serial_no", "identification_details", "calibration_done_date",
                    "url_number", "certificate_date",
                    "calibration_due_date", "calibration_remainder_date_1",
                ],
                include: [
                    {
                        model: Lab,
                        as: "lab",
                        attributes: [
                            "contact_email",
                            "email_smtp_server_host", "email_smtp_server_port", "sender_email", "sender_password"
                        ]
                    },
                    {
                        model: SRF,
                        as: "srf",
                        attributes: [
                            "srf_number", "contact_name", "contact_email"
                        ]
                    }
                ]
            });
            // return console.log(result);

            const pdfURL = path.join(__dirname, '../certificates', fileName);

            const { msg, status } = await sendMail(srfItemsQuery, pdfURL);
            console.log({ msg, status });

            res.set({
                "Content-Type": "application/pdf",
                "Content-Length": buffer.length
            });
            return res.sendFile(pdfURL);
        });

    } catch (err) {
        console.log(err);
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        error.path = "Certificate Create Error";
        return errorHandler(error, req, res, next);
    }
}

const download = async (req, res, next) => {

    try {

        const { srf_item_id } = req.body;

        // ***  Query Certificate by srf_item_id ***
        let certificate = await Certificate.findOne({
            where: { srfitemId: srf_item_id },
            order: [['createdAt', 'DESC']]
        });

        const fileName = certificate?.fileName;

        const docPath = path.join(__dirname, "..", "certificates", fileName);

        return res.sendFile(docPath);
    } catch (err) {
        console.log(err);

        let action = "Failed to download certificate";
        const error = new Error(action);
        error.code = 500;
        error.path = "Download Certificate";
        return errorHandler(error, req, res, next);
    }
}

// *** Result Table Models ***
const masterDesignProcedure = require("../models").master_design_procedure;

const standard_details = async (req, res, next) => {

    // ***  Query Master Result List  *** 
    let query = await masterDesignProcedure.findOne();
    let master_list_equipments = query.master_list_equipments;

    let description = [];
    let make = [];
    let serial_no = [];
    let certificate_no = [];
    let validity = [];
    let traceability = [];

    master_list_equipments?.map((eachItem) => {
        description?.push(eachItem.remark);
        make?.push(eachItem.make);
        serial_no?.push(eachItem.serial_no);
        certificate_no?.push(eachItem.calibration_certificate_no);
        validity?.push(eachItem.calibration_valid_upto);
        traceability?.push(eachItem.traceability);
    });

    const m_description = description?.join("/");
    const m_make = make?.join("/");
    const m_serial_no = serial_no?.join("/");
    const m_certificate_no = certificate_no?.join("/");
    const m_validity = validity?.join("/");
    const m_traceability = traceability?.join("/");

    return res.json({ m_description, m_make, m_serial_no, m_certificate_no, m_validity, m_traceability });
}

exports.generate = generate;
exports.download = download;
exports.standard_details = standard_details;