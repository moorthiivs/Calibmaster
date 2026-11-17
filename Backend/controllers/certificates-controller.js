var pdfMake = require("pdfmake/build/pdfmake");
var pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake || {};
var fs = require("fs");
const path = require('path');
const imageDataURI = require('image-data-uri');

// *** Import Models ***
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const instrument = require("../models").instrument;
const instrumentTypeModel = require("../models").instrument_type;
const MasterListEquipment = require("../models").MasterListEquipment;

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

const vernierCaliper = async (req, res, next) => {

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

    // Set DUC Details table data
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

    // Set Standards/Master Details table data
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

    let calibrationArray = [
        [
            { text: 'STD READING', alignment: 'center' },
            { text: 'EXTERNAL', alignment: 'center' },
            { text: 'ERROR', alignment: 'center' },
            { text: 'INTERNAL', alignment: 'center' },
            { text: 'ERROR', alignment: 'center' },
            { text: 'DEPTH', alignment: 'center' },
            { text: 'ERROR', alignment: 'center' },
        ],
    ];

    for (let i = 0; i < calibration.length; i++) {
        const keys = Object.values(calibration[i]);

        let eachObj = [
            keys[1],
            keys[2],
            keys[3],
            keys[4],
            keys[5],
            keys[6],
            keys[7]
        ];

        calibrationArray.push(eachObj);
    }
    // return res.json(calibrationArray);

    let docDefinition = {
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
                            { text: 'DESCRIPTION: Vernier Caliper' },
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
            {
                alignment: 'justify',
                columns: [
                    {
                        width: 'auto',
                        style: 'calibrationTable',
                        table: {
                            widths: [70, 60, 50, 60, 50, 50, 50],
                            headerRows: 1,
                            keepWithHeaderRows: 1,
                            body: calibrationArray
                        }
                    },
                    {
                        width: '*',
                        style: 'uncertainityTable',
                        table: {
                            heights: [20, 148],
                            body: [
                                ['UNCERTAINTY ± μm'],
                                [
                                    { text: `${uncertainty}`, margin: [0, 50, 0, 0] }
                                ]
                            ]
                        }
                    }
                ],
                columnGap: 0
            },
            { text: 'REMARKS:', margin: [0, 0, 0, 5], pageBreak: 'before' },
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
        }
    }

    let pdfDocGenerator = pdfMake.createPdf(docDefinition, {});

    pdfDocGenerator.getBuffer(function (buffer) {

        const todayDate = new Date().getTime();
        const fileName = `certificate-001-${todayDate}.pdf`;

        fs.writeFileSync(`./public/certificate/${fileName}`, buffer);

        const pdfURL = path.join(__dirname, '../public/certificate', fileName);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Length": buffer.length
        });
        return res.sendFile(pdfURL);
    });
}

const weighingBalance = async (req, res, next) => {

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

    var calibrationArray = [
        [
            { text: 'STD READING', alignment: 'center' },
            { text: 'EXTERNAL', alignment: 'center' },
            { text: 'ERROR', alignment: 'center' },
            { text: 'INTERNAL', alignment: 'center' },
            { text: 'ERROR', alignment: 'center' }
        ],
    ];

    for (let i = 0; i < calibration.length; i++) {
        const keys = Object.values(calibration[i]);

        let eachObj = [
            keys[1],
            keys[2],
            keys[3],
            keys[4],
            keys[5]
        ];

        calibrationArray.push(eachObj);
    }
    // return res.json(calibrationArray);

    var repeatabilityArray = [
        [
            { text: 'ZERO', alignment: 'center' },
            { text: 'HALF LOAD', alignment: 'center' },
            { text: 'HALF LOAD', alignment: 'center' }
        ],
        [
            { text: 'Kg', alignment: 'center' },
            { text: 'Kg', alignment: 'center' },
            { text: 'Kg', alignment: 'center' }
        ],
    ];

    for (let i = 0; i < repeatability.length; i++) {
        const keys = Object.values(repeatability[i]);

        let eachObj = [
            keys[1],
            keys[2],
            keys[3]
        ];

        repeatabilityArray.push(eachObj);
    }
    // return res.json(repeatabilityArray);

    var eccentricityArray = [
        [
            { text: 'PAN POSITION', rowSpan: 2 },
            { text: 'STD. READING', },
            { text: 'DUC. READING' },
            { text: 'ERROR' },
        ],
        [
            { text: '' },
            { text: 'Kg' },
            { text: 'Kg' },
            { text: 'Kg' },
        ],
    ];

    for (let i = 0; i < eccentricity.length; i++) {
        const keys = Object.values(eccentricity[i]);

        let eachObj = [
            keys[0],
            keys[1],
            keys[2],
            keys[3]
        ];

        eccentricityArray.push(eachObj);
    }
    // return res.json(eccentricityArray);

    var docDefinition = {
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
            {
                alignment: 'justify',
                columns: [
                    {
                        width: 'auto',
                        style: 'calibrationTable',
                        table: {
                            widths: [100, 90, 90, 70, 70],
                            headerRows: 1,
                            keepWithHeaderRows: 1,
                            body: calibrationArray
                        }
                    },
                    {
                        width: '*',
                        style: 'uncertainityTable',
                        table: {
                            heights: [20, 191],
                            body: [
                                ['UNCERTAINTY ± μm'],
                                [
                                    { text: `${uncertainty}`, margin: [0, 50, 0, 0] }
                                ]
                            ]
                        }
                    }
                ],
                columnGap: 0
            },

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

            { text: 'REPEATABILITY TEST:', margin: [0, 10, 0, 5] },
            {
                style: 'repeatabilityTable',
                table: {
                    widths: [100, '*', 200],
                    body: repeatabilityArray
                }
            },

            { text: 'ECCENTRICITY TEST:', margin: [0, 10, 0, 5] },
            {
                alignment: 'justify',
                columns: [
                    {
                        width: 'auto',
                        style: 'eccentricityTable',
                        table: {
                            widths: [120, 100, 100, 100],
                            headerRows: 1,
                            keepWithHeaderRows: 1,
                            body: eccentricityArray
                        }
                    },
                    {
                        width: '*',
                        style: 'panDiagramTable',
                        table: {
                            heights: [20, 104],
                            body: [
                                ['PAN DIAGRAM'],
                                [
                                    {
                                        image: pandiagramLogoBuffer,
                                        width: 100
                                    },
                                ]
                            ]
                        }
                    }
                ],
                columnGap: 0
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
        }
    }

    var pdfDocGenerator = pdfMake.createPdf(docDefinition, {});

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

exports.vernierCaliper = vernierCaliper;
exports.weighingBalance = weighingBalance;