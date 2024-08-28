// *** Import Dev Packages ***
var pdfMake = require("pdfmake/build/pdfmake");
var pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake.vfs;
var fs = require("fs");
const path = require('path');
const imageDataURI = require('image-data-uri');
const nodemailer = require("nodemailer");

// *** Import Core Module From sequelize ***
const { Op } = require("sequelize");

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
        return await imageDataURI.encodeFromFile(imagePath).then(dataURI => dataURI)
    } catch (error) {
        console.log(error);
        return false;
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
            where: { lab_id, srf_id, srf_item_id },
            include: ["calibrated_employee_master", "approved_employee_master"]
        });
        // return res.json(masterResult);

        if (!masterResult) {
            let action = "Master Result is not available";
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

        // *** Create Format for Master list Equipments ***
        let masterListEquipment = await standard_details(masterResult?.master_list_equipments);
        const { m_description, m_make, m_serial_no, m_certificate_no, m_validity, m_traceability } = masterListEquipment;
        // return res.json(masterListEquipment);

        const masterDescription = m_description;
        const masterMake = m_make;
        const masterSlNo = m_serial_no;
        const masterCertificateNo = m_certificate_no;
        const masterValidity = m_validity;
        const masterTraceability = m_traceability;

        // *** Find Lab Logos ***
        const lab = await Lab.findOne({
            attributes: [
                'lab_name',
                'address1', 'address2', 'address3',
                'city', 'state', 'country', 'pincode',
                'lab_website', 'contact_email', 'contact_number1', 'contact_number2',
                'brand_logo_filename', 'seal_image_filename',
                'certificate_accreditation_qr_code_logo_1', 'scope_accreditation_qr_code_logo_2'
            ],
            where: { lab_id },
        });
        // return res.json(lab);

        // *** Find Results ***
        const tableDesignArr = await resultTable.findAll({
            where: {
                master_result_table_id: masterResult?.master_result_table_id,
                print_on_certifcate: 'YES'
            },
            order: [
                ['fromId', 'ASC'],
            ],
        });
        // return res.json(tableDesignArr);

        const bigEyeObj = [];

        for (let x = 0; x < tableDesignArr.length; x++) {

            const Columns = tableDesignArr[x].columns;
            const table_type = tableDesignArr[x].table_type;

            const FirstHeaderTexts = tableDesignArr[x].header_texts;
            const secondHeaderTexts = tableDesignArr[x].second_row_headers;

            const headerTypes = tableDesignArr[x].header_types;
            const cellTexts = tableDesignArr[x].cell_texts;

            // const widthsArr = [];

            // const eachTableContainer = [];

            // for (let i = 0; i < cellTexts?.length; i++) {
            //     let eachRow = [];
            //     for (const key in cellTexts[i]) {
            //         eachRow.push({ text: cellTexts[i][key]?.val });
            //     }
            //     eachTableContainer.push(eachRow)
            // }

            // for (let i = 0; i < Columns; i++) {
            //     if (Columns <= 10) {
            //         widthsArr.push(100);
            //     } else {
            //         widthsArr.push(60);
            //     }
            // }

            // const eachObj = {
            //     style: 'eachTableStyle',
            //     color: '#444',
            //     table: {
            //         widths: widthsArr,
            //         headerRows: 2,
            //         keepWithHeaderRows: 1,
            //         body: eachTableContainer
            //     }
            // }
            // bigEyeObj.push(eachObj);

            // added newly
            const eachTableContainer = [];

            for (let i = 0; i < cellTexts?.length; i++) {
                let eachRow = [];
                for (const key in cellTexts[i]) {
                    let {val,constFormula} = cellTexts[i][key];
                    const header=constFormula.split(/[\(\)]/);
                    if(header[0].trim()==='HEADER')
                        eachRow.push({ text: val, bold: true });
                    else 
                        eachRow.push({ text: val === '--' ? '' : val });
                }
                eachTableContainer.push(eachRow)
            }

            let eachTable = []
            let startingIndex = 0;
            let endingIndex = 8;

            for (let i = 1; i <= Math.ceil(Columns / 8); i++) {
                endingIndex *= i;
                let eachRow = []
                eachTableContainer.map((row) => {
                    eachRow.push(row.slice(startingIndex, endingIndex));
                })
                startingIndex += 8;
                eachTable.push(eachRow)
            }
            eachTable.map((tableItem) => {

                let widthsArr = []
                for (let i = 0; i < tableItem[0].length; i++) {
                    widthsArr.push(60);
                }

                const eachObj = {
                    style: 'eachTableStyle',
                    color: '#444',
                    table: {
                        widths: widthsArr,
                        headerRows: 1,
                        keepWithHeaderRows: 1,
                        body: tableItem
                    }
                }
                bigEyeObj.push(eachObj);
            })
            // bigEyeObj.push(cellTexts);
        }
        // return res.json(bigEyeObj);

        // *** Seal & Logos area ***
        let calibrated_employee_master = await masterResult.calibrated_employee_master;
        let calibrated_employee_name = calibrated_employee_master.employee_full_name;
        let calibrated_employee_signature = calibrated_employee_master.employee_signature;

        let approved_employee_master = await masterResult.approved_employee_master;
        let approved_employee_name = approved_employee_master.employee_full_name;
        let approved_employee_signature = approved_employee_master.employee_signature;

        const labLogo_1_Path = path.resolve(__dirname, `../public/images/${lab.brand_logo_filename}`);
        const labLogo_1_Buffer = await imageToBuffer(labLogo_1_Path);

        // *** Lab Other Brand Logo 1 Start ***
        let labLogo_2_Buffer = '';
        let labLogo_2_array = [];

        const labLogo_2_Path = path.resolve(__dirname, `../public/images/${lab.other_logo1_image_filename}`);

        if (lab.other_logo1_image_filename !== undefined) {
            labLogo_2_Buffer = await imageToBuffer(labLogo_2_Path);
            if (labLogo_2_Buffer) {
                return labLogo_2_array.push({ width: 80, image: labLogo_2_Buffer });
            }
        }
        // *** Lab Other Brand Logo 1 End ***

        // *** Lab QR LOGO-1 Start ***
        let lab_QR_LOGO_1_Buffer = '';
        const lab_QR_Logo_1_Path = path.resolve(__dirname, `../public/images/${lab.certificate_accreditation_qr_code_logo_1}`);

        if (lab.certificate_accreditation_qr_code_logo_1 !== undefined) {
            lab_QR_LOGO_1_Buffer = await imageToBuffer(lab_QR_Logo_1_Path);
        }
        // *** Lab QR LOGO-1 End ***

        // *** Lab QR LOGO-2 Start ***
        let lab_QR_LOGO_2_Buffer = '';
        const lab_QR_Logo_2_Path = path.resolve(__dirname, `../public/images/${lab.scope_accreditation_qr_code_logo_2}`);

        if (lab.scope_accreditation_qr_code_logo_2 !== undefined) {
            lab_QR_LOGO_2_Buffer = await imageToBuffer(lab_QR_Logo_2_Path);
        }
        // *** Lab QR LOGO-2 End ***

        const sealLogoPath = path.resolve(__dirname, `../public/images/${lab.seal_image_filename}`);
        const sealBuffer = await imageToBuffer(sealLogoPath);

        const sign1LogoPath = path.resolve(__dirname, `../public/${calibrated_employee_signature}`);
        const sign1LogoBuffer = await imageToBuffer(sign1LogoPath);

        const sign2LogoPath = path.resolve(__dirname, `../public/${approved_employee_signature}`);
        const sign2LogoBuffer = await imageToBuffer(sign2LogoPath);

        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [20, 130, 20, 90],
            header: [
                {
                    alignment: 'justify',
                    columnGap: 0,
                    columns: [
                        {
                            width: 80,
                            image: labLogo_1_Buffer,
                            margin: [15, 10, 0, 0]
                        },
                        [
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
                        {
                            width: 100,
                            columns: [],
                            margin: [0, 10, 0, 0]
                        }
                    ]
                },
            ],
            footer: function (currentPage, pageCount) {
                return [
                    {
                        alignment: 'left',
                        columnGap: 5,
                        columns: [
                            { text: footerLongText, width: 'auto' },
                            lab_QR_LOGO_1_Buffer ? { image: lab_QR_LOGO_1_Buffer, width: 50, } : { text: '' },
                            lab_QR_LOGO_2_Buffer ? { image: lab_QR_LOGO_2_Buffer, width: 50, } : { text: '' },
                        ],
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
                                { text: `ULR NUMBER: ${item?.url_number}` },
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
                    },
                    layout: {
                        hLineColor: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 'white' : 'black';
                        },
                    }
                },
                {
                    style: '3rdTable',
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [
                                { text: `DESCRIPTION: ${description}` },
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
                    },
                    layout: {
                        hLineColor: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 'white' : 'black';
                        },
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
                    },
                    layout: {
                        hLineColor: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 'white' : 'black';
                        },
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
                    },
                    layout: {
                        hLineColor: function (i, node) {
                            return (i === 0) ? 'white' : 'black';
                        },
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
                                { text: `${calibrated_employee_name}`, listType: 'none' },
                                { text: 'Calibrated By', listType: 'none' }
                            ],
                            alignment: 'center'
                        },
                        sealBuffer ? { image: sealBuffer, width: 80, margin: [0, 0, 0, 0], alignment: 'center' } : { text: '' },
                        {
                            ul: [
                                {
                                    image: sign2LogoBuffer,
                                    width: 50,
                                    margin: [0, 0, 0, 0],
                                    alignment: 'center'
                                },
                                { text: `${approved_employee_name}`, listType: 'none' },
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
                    margin: [0, 10, 0, 10],
                    fontSize: 9
                }
            }
        };

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

const standard_details = async (master_list_equipments) => {

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

        if (eachItem?.calibration_valid_upto) {
            let vDate = eachItem?.calibration_valid_upto;
            vDate = new Date(vDate);
            vDate = `${new Date(vDate).getDate() - 1}/${new Date(vDate).getMonth() + 1}/${new Date(vDate).getFullYear()}`;
            validity?.push(vDate);
        }

        traceability?.push(eachItem.traceability);
    });

    const m_description = description?.join("/");
    const m_make = make?.join("/");
    const m_serial_no = serial_no?.join("/");
    const m_certificate_no = certificate_no?.join("/");
    const m_validity = validity?.join(",");
    const m_traceability = traceability?.join(",");

    return { m_description, m_make, m_serial_no, m_certificate_no, m_validity, m_traceability };
}

exports.generate = generate;
exports.download = download;
exports.standard_details = standard_details;