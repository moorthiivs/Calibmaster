var pdfMake = require("pdfmake/build/pdfmake");
var pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake.vfs;
var fs = require("fs");
const path = require('path');
const imageDataURI = require('image-data-uri');

// *** Import Models ***
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const instrument = require("../models").instrument;
const instrumentTypeModel = require("../models").instrument_type;
const MasterListEquipment = require("../models").MasterListEquipment;
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

const footerLongText = "The Calibration Certificate is valid only for the condition of the received DUC at the time under the stated condition of calibration. The calibration certificate shall not be reproduced in full without written approval of TCS Head. DUC: Device Under Calibration. Calibration Measurement are traceable to SI Units through unbroken chain of calibration from competent laboratory.";

const create = async (req, res, next) => {

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

    const certificate_number = new Date().getTime();

    // ***  Query SRF-Items by srf_item_id *** 
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
    const idNo = item?.serial_no;
    const range = `${item?.intrument_type?.range_minimum} - ${item?.intrument_type?.range_maximum} ${item?.intrument_type?.range_maximum_uom?.uom_printsysmbol}`
    const lc = `${item?.intrument_type?.least_count} ${item?.intrument_type?.least_count_uom?.uom_printsysmbol}`;

    // ***  Query Master List Equipmentsby master_list_equipment_id *** 
    let masterListEquipment = await MasterListEquipment.findOne({
        where: { master_list_equipment_id }
    });

    if (!masterListEquipment) {
        let action = "Master Equipment is not available";
        const error = new Error(action);
        error.code = 501;
        return errorHandler(error, req, res, next);
    }

    // *** Set standards/Master details table data *** 
    const masterDescription = masterListEquipment?.name_of_equipment;
    const masterMake = masterListEquipment?.make;
    const masterSlNo = masterListEquipment?.serial_no;
    const masterCertificateNo = masterListEquipment?.calibration_certificate_no;
    const masterValidity = validity;
    const masterTraceability = traceability;

    // return res.json({ masterListEquipment });

    const sealLogoPath = path.resolve(__dirname, '../public/logos/seal.jpg');
    const sealBuffer = await imageToBuffer(sealLogoPath);

    const sign1LogoPath = path.resolve(__dirname, '../public/logos/sign-1.png');
    const sign1LogoBuffer = await imageToBuffer(sign1LogoPath);

    const sign2LogoPath = path.resolve(__dirname, '../public/logos/sign-2.png');
    const sign2LogoBuffer = await imageToBuffer(sign2LogoPath);

    const pandiagramLogoPath = path.resolve(__dirname, '../public/logos/pandiagram.png');
    const pandiagramLogoBuffer = await imageToBuffer(pandiagramLogoPath);

    // *** Find Results ***
    const tableDesignArr = await resultTable.findAll({
        where: { master_result_table_id: 3 },
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
            widthsArr.push("*");
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

    const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [20, 130, 20, 90],
        header: [
            {
                text: 'DEMO CALIBRATION SERVICES',
                alignment: 'center', fontSize: 18, bold: true,
                margin: [0, 10, 0, 0],
            },
            {
                text: '25/50 Kalighat Area 15th Street, Shyama Prasad Mukherjee Kolkata - 600 0100',
                alignment: 'center', fontSize: 12,
                margin: [0, 5, 0, 0],
            },
            {
                text: 'Mobile: 9804806699/55480 18000/ 91767 40455 / Website: www.dempcalibration.com',
                alignment: 'center', fontSize: 12,
                margin: [0, 2, 0, 0],
            },
            {
                text: 'Email: democalibrationservices@gmail.com / democalibrationservices@yahoo.com / calibrationdemo2016@gmail.com',
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
                            { text: `CALIBRATION PROCEDURE & REF.STD: ${calibration_procedure}` }
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
                ol: [
                    { text: `${remark_1}` },
                    { text: `${remark_2}` },
                    { text: `${remark_3}` },
                    { text: `${remark_4}` },
                    { text: `${remark_5}` }
                ]
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

    pdfDocGenerator.getBuffer(function (buffer) {

        const todayDate = new Date().getTime();
        const fileName = `certificate-002-${todayDate}.pdf`;

        fs.writeFileSync(`./public/certificate/${fileName}`, buffer);

        const pdfURL = path.join(__dirname, '../public/certificate', fileName);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Length": buffer.length
        });
        return res.sendFile(pdfURL);
    });
}

exports.create = create;