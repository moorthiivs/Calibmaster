// *** Import Dev Packages ***
//var pdfMake = require("pdfmake/build/pdfmake");
var fs = require("fs");
const path = require('path');
const imageDataURI = require('image-data-uri');
const nodemailer = require("nodemailer");
const { CUSTOMER_PORTAL_SERVER } = require("../utils/config");
// *** Import Core Module From sequelize ***
const { Op } = require("sequelize");

// *** Import Models ***
const Lab = require("../models").Lab;
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const instrument = require("../models").instrument;
const instrumentTypeModel = require("../models").instrument_type;
const instrumentGroups = require("../models").instrument_groups;
const instrumentDiscipline = require("../models").instrument_discipline;

const MasterListEquipment = require("../models").MasterListEquipment;
const Certificate = require("../models").Certificate;

// *** Result Table Models ***
const masterResultTable = require("../models").master_result_table;
const resultTable = require("../models").result_table;


const { ProcedureResult } = require('../models');
const EParameter = require("../models").EParameter

const { generatePdfFromSheet, generatePdfTables } = require('../utils/pdfUtils');

const calibmasterexcel = require('../models').CalibmasterExcel

const PdfPrinter = require('pdfmake');

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../fonts/Roboto-Regular.ttf'),
        bold: path.join(__dirname, '../fonts/Roboto-Bold.ttf'),
        italics: path.join(__dirname, '../fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '../fonts/Roboto-BoldItalic.ttf'),
    },
    DejaVu: {
        normal: path.join(__dirname, '../fonts/DejaVuSans.ttf'),
        bold: path.join(__dirname, '../fonts/DejaVuSans-Bold.ttf'),
        italics: path.join(__dirname, '../fonts/DejaVuSans-Oblique.ttf'),
        bolditalics: path.join(__dirname, '../fonts/DejaVuSans-BoldOblique.ttf'),
    },
};

const printer = new PdfPrinter(fonts);


ProcedureResult.belongsTo(calibmasterexcel, {
    foreignKey: 'master_design_procedure_id',
    targetKey: 'master_design_procedure_id'
})

// Error Handler 
const { errorHandler } = require("../helpers/error-handler");
const { generateImageContent } = require("../utils/ProcedureImage");
const { generateObservationReport } = require("../utils/generateObservationReport");

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


const isValid = (value) => {
    if (value === null || value === undefined) return false;

    if (typeof value === 'string' && value.trim() === '') return false;

    if (Array.isArray(value) && value.length === 0) return false;

    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return false;

    return true;
};



const footerLongText = "The Calibration Certificate is valid only for the condition of the received DUC at the time under the stated condition of calibration. The calibration certificate shall not be reproduced in full without written approval of Lab Management. DUC: Device Under Calibration. Calibration Measurement are traceable to SI Units through unbroken chain of calibration from competent laboratory.Recommended due date for calibration is provided by customer.";

const generate = async (req, res, next) => {


    const { lab_id, srf_id, srf_item_id, customer_info } = req.body;

    const skip_response = req.body?.skip_response || false;

    try {

        //const certificate_number = new Date().getTime();


        const excelTable = await ProcedureResult.findOne({
            where: {
                labid: lab_id,
                srf_id,
                srf_item_id
            },
            attributes: ["ExcelData", "print_on_certificate", "print_on_observation", "Mergedcell", "Styles", "decimalPrecision"],
            include: [{
                model: calibmasterexcel,
                as: 'CalibmasterExcel',
                attributes: ['diagram_image'],
                required: false,
            }]
        });

        
        const EParameterData = await EParameter.findOne({
            where:{
                lab_id:`'${lab_id}'`
            }
        })
        
        const procedureimages = excelTable.CalibmasterExcel ? excelTable.CalibmasterExcel.diagram_image : null;

        const imageContent = await generateImageContent(procedureimages);

        // Extract relevant data
        const excelData = excelTable.dataValues.ExcelData;
        const mergedCells = excelTable.dataValues.Mergedcell;
        const Styles = excelTable.dataValues.Styles;
        const decimalPoint = excelTable.dataValues.decimalPrecision;
        const selectedSheet_Cert = excelTable.dataValues.print_on_certificate;
        const selectedSheet_Obs = excelTable.dataValues.print_on_observation;

        const ExcelProcedureTablelayout = {
            hLineWidth: (i, node) => i === 0 || i === node.table.body.length ? 0.5 : 0.2,
            vLineWidth: () => 0.2,
            hLineColor: () => '#cccccc',
            vLineColor: () => '#cccccc',
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 3,
            paddingBottom: () => 3
        };
        const observationTablelayout = {
            hLineWidth: () => 0.2,
            vLineWidth: () => 0.2,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
        };

        // Generate table content for both certificate and observation
        const ExcelProcedureTable = await generatePdfFromSheet(excelData, mergedCells, Styles, selectedSheet_Cert, decimalPoint, ExcelProcedureTablelayout, fontSize = 6);
        const observationTable = isValid(selectedSheet_Obs) ? await generatePdfFromSheet(excelData, mergedCells, Styles, selectedSheet_Obs, decimalPoint, observationTablelayout, fontSize = 6) : null

        // Validate generation
        if (!ExcelProcedureTable) {
            throw new Error("Failed to generate PDF tables from Excel data.");
        }


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
                            attributes: ["instrument_name", "instrument_discipline_id", "instrument_group_id"]
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

        const disciplineId = item?.intrument_type?.instrument?.instrument_discipline_id;
        const groupId = item?.intrument_type?.instrument?.instrument_group_id;

        let disciplineName = null;
        let groupName = null;

        if (disciplineId) {
            const discipline = await instrumentDiscipline.findOne({
                where: { instrument_discipline_id: disciplineId },
                attributes: ['instrument_discipline']
            });
            disciplineName = discipline?.instrument_discipline || null;
        }

        if (groupId) {
            const group = await instrumentGroups.findOne({
                where: { instrument_group_id: groupId, instrument_discipline_id: disciplineId },
                attributes: ['group_details']
            });
            groupName = group?.group_details || null;
        }

        const itemCount = await Item.count({
            where: {
                srf_id: srf_id,
                rstatus: 1
            }
        });


        if (!item) {
            let action = "SRF-Item is not available";
            const error = new Error(action);
            error.code = 501;
            return skip_response || errorHandler(error, req, res, next);
        }

        // ***  Set First table data *** 
        let customer_name = item?.srf?.customer?.customer_name;
        let customer_address = [
            item?.srf?.customer?.address1?.replace(/,\s*$/, '').trim(),
            item?.srf?.customer?.address2?.replace(/,\s*$/, '').trim(),
            item?.srf?.customer?.address3?.replace(/,\s*$/, '').trim(),
            item?.srf?.customer?.city?.replace(/,\s*$/, '').trim(),
            item?.srf?.customer?.state?.replace(/,\s*$/, '').trim(),
        ].filter(Boolean).join(', ');

        if (item?.srf?.customer?.pincode)
            customer_address += ` - ${item.srf.customer.pincode}.`;
        else
            customer_address += '.';

        let date_of_issue = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
        let received_date = item?.srf?.customer_dc_date;
        let cal_date = item?.calibration_done_date;
        let due_date = item?.calibration_due_date;
        const condition = item?.remarks;

        if (received_date != null) {
            received_date = new Date(received_date).toLocaleDateString('en-GB'); // Formats as DD/MM/YYYY
        } else {
            received_date = "-";
        }

        if (cal_date != null) {
            cal_date = new Date(cal_date).toLocaleDateString('en-GB'); // Formats as DD/MM/YYYY
        } else {
            cal_date = "-";
        }

        if (due_date != null) {
            due_date = new Date(due_date).toLocaleDateString('en-GB'); // Formats as DD/MM/YYYY
        } else {
            due_date = "-";
        }

        // ***  Set duc details table data *** 
        const description = item?.intrument_type?.instrument?.instrument_name;
        const make = item?.make;
        const model = item?.model;
        const slNo = item?.serial_no;
        const idNo = item?.identification_details;
        let iselectroParameters = false
        const instrumentDynamicRows = formatDynamicRowsFromOriginalRanges(item?.intrument_type?.ranges);
        const range = item?.intrument_type?.range_minimum ?? ''
        const lc = item?.intrument_type?.least_count ?? ''
        const type = item?.intrument_type?.type;

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
            return skip_response || errorHandler(error, req, res, next);
        }

        // *** Set standards details table data *** 
        const ulr_number = masterResult?.ulr_number;
        const calibration_procedure = masterResult?.calibration_procedure;
        const ref_std = masterResult?.ref_std;
        const temperature = masterResult?.temperature?.mean + '°C';
        const humidity = masterResult?.humidity?.mean + '%';
        const AtmosphericPressure = masterResult?.atmospheric_pressure
        const Frequency = masterResult?.frequency
        const remark = masterResult?.remarks;
        const remarks = Array.isArray(remark) ? remark.map(r => r.replace(/\s+/g, ' ').trim()) : [];


        // *** Create Format for Master list Equipments ***
        let masterListEquipment = await standard_details(masterResult?.master_list_equipments);


        let standard_details_Table = await standard_details_tableData(masterResult?.master_list_equipments)


        const { m_description, m_make, m_serial_no, m_certificate_no, m_validity, m_traceability, m_identification_details, m_certificate_filename, master_quantity } = masterListEquipment;
        // return res.json(masterListEquipment);

        const srf = item.srf.dataValues.srf_number;

        const currentYear = new Date().getFullYear();  // Get current year (e.g., 2025)

        const prevYear = currentYear - 1;             // Get previous year (e.g., 2024)

        const yearRange = `${prevYear.toString().slice(-2)}-${currentYear.toString().slice(-2)}`;

        const certificate_number = `DCPL/CAL/${yearRange}/${srf}`;

        const masterDescription = m_description;
        const masterMake = m_make;
        const masterSlNo = m_serial_no;
        const masterCertificateNo = m_certificate_no;
        const masterValidity = m_validity;
        const masterTraceability = m_traceability;
        const masterId_no = m_identification_details;


        // *** Find Lab Logos ***
        const lab = await Lab.findOne({
            attributes: [
                'lab_name',
                'address1', 'address2', 'address3',
                'city', 'state', 'country', 'pincode',
                'lab_website', 'contact_email', 'contact_number1', 'contact_number2',
                'brand_logo_filename', 'seal_image_filename', 'nabl_logo_filename',
                'certificate_accreditation_qr_code_logo_1', 'scope_accreditation_qr_code_logo_2'
            ],
            where: { lab_id },
        });

        // *** Seal & Logos area ***
        let calibrated_employee_master = await masterResult.calibrated_employee_master;
        let calibrated_employee_name = calibrated_employee_master.employee_full_name;
        let calibrated_employee_role = calibrated_employee_master.employee_role;
        let calibrated_employee_signature = calibrated_employee_master.employee_signature;

        let approved_employee_master = await masterResult.approved_employee_master;
        let approved_employee_name = approved_employee_master.employee_full_name;
        let approved_employee_role = approved_employee_master.employee_role;
        let approved_employee_signature = approved_employee_master.employee_signature;

        let lab_address = [
            lab.address1?.replace(/,\s*$/, '').trim(),
            lab.address2?.replace(/,\s*$/, '').trim(),
            lab.address3?.replace(/,\s*$/, '').trim(),
            '\n' + lab.city?.replace(/,\s*$/, '').trim(),
            lab.state?.replace(/,\s*$/, '').trim(),
        ].filter(Boolean).join(', ');

        if (lab?.pincode)
            lab_address += ` - ${lab?.pincode}.`;
        else
            lab_address += '.';

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

        const nablLogoPath = path.resolve(__dirname, `../public/images/${lab.nabl_logo_filename}`);
        const nablBuffer = await imageToBuffer(nablLogoPath);

        const sign1LogoPath = path.resolve(__dirname, `../public/${calibrated_employee_signature}`);
        const sign1LogoBuffer = await imageToBuffer(sign1LogoPath);

        const sign2LogoPath = path.resolve(__dirname, `../public/${approved_employee_signature}`);
        const sign2LogoBuffer = await imageToBuffer(sign2LogoPath);


        function capitalizeEachWord(params) {
            if (params === Number || params === null || params === undefined) return params
            return params
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }

        let environmentalwidths = [];
        let environmentalbody = [];

        // Step 1: Build the main row
        let secondRow = [
            { text: 'TEMPERATURE (°C):' },
            { text: temperature || '-', alignment: 'center' },
            { text: 'HUMIDITY (RH %):' },
            { text: humidity || '-', alignment: 'center' }
        ];

        if (AtmosphericPressure) {
            secondRow.push({ text: 'ATMOSPHERIC PRESSURE (mbar):' });
            secondRow.push({ text: AtmosphericPressure || '-', alignment: 'center' });
        }
        if (Frequency) {
            secondRow.push({ text: 'FREQUENCY (Hz):' });
            secondRow.push({ text: Frequency || '-', alignment: 'center' });
        }

        // Step 2: Match colSpan and filler cells for the header
        const totalCols = secondRow.length;
        const headerRow = [
            {
                text: 'ENVIRONMENTAL CONDITION',
                alignment: 'center',
                colSpan: totalCols,
                decoration: 'underline'
            },
            ...Array(totalCols - 1).fill({})
        ];

        environmentalbody.push(headerRow);
        environmentalbody.push(secondRow);
        environmentalwidths = Array(totalCols).fill(`${(100 / totalCols).toFixed(2)}%`);
        const thirdTableBody = [
            [
                { text: 'DESCRIPTION:' },
                { text: capitalizeEachWord(description) || '-', alignment: 'center' },
                { text: 'DUC RECEIPT CONDITION:' },
                { text: capitalizeEachWord(condition) || '-', alignment: 'center' },
            ],
            [
                { text: 'MAKE:' },
                { text: capitalizeEachWord(make) || '-', alignment: 'center' },
                { text: 'MODEL:' },
                { text: capitalizeEachWord(model) || '-', alignment: 'center' }
            ],
            [
                { text: 'SL.NO:' },
                {
                    text: capitalizeEachWord(slNo) || "-", alignment: 'center'
                },
                { text: 'ID.NO:' },
                { text: capitalizeEachWord(idNo) || "-", alignment: 'center' }
            ],
            ...(instrumentDynamicRows || buildRangeLcTypeRow(range, lc, type)),
            [
                { text: 'CALIBRATION PROCEDURE & REF.STD:', alignment: 'left', colSpan: 2 },
                {},
                { text: `${capitalizeEachWord(calibration_procedure) || '-'} & ${ref_std || '-'}`, alignment: 'center', colSpan: 2 },
                {}
            ]
        ];

        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [20, 130, 20, 70],
            background: (currentPage, pageSize) => {
                return {
                    image: labLogo_1_Buffer,
                    width: 200,
                    height: 300,
                    opacity: 0.1,
                    absolutePosition: {
                        x: (pageSize.width - 200) / 2,
                        y: (pageSize.height - 300) / 2
                    }
                };
            },
            header: function (currentPage, pageCount) {
                return [
                    {
                        alignment: 'justify',
                        columnGap: 0,
                        columns: [
                            {
                                width: 80,
                                height: 80,
                                image: labLogo_1_Buffer,
                                margin: [10, 25, 0, 0],
                            },
                            [
                                {
                                    text: `${lab.lab_name.toUpperCase()}`,
                                    alignment: 'center',
                                    fontSize: 20,
                                    bold: true,
                                    margin: [0, 20, 0, 0],
                                    color: "#002e69",
                                },
                                {
                                    text: lab_address,
                                    alignment: 'center',
                                    fontSize: 18,
                                    margin: [5, 3, 5, 0],
                                    lineHeight: 1.1,
                                    color: "#000000",
                                    bold: true,
                                },
                                // {
                                //     text: `Mobile: ${lab.contact_number1}${lab.contact_number2 ? ` | ${lab.contact_number2}` : ''} / Website: ${lab.lab_website}`,
                                //     alignment: 'center',
                                //     fontSize: 9,
                                //     margin: [0, 2, 0, 0],
                                //     lineHeight: 1.1
                                // },
                                // {
                                //     text: `Mobile: ${lab.contact_number1}${lab.contact_number2 ? ` / ${lab.contact_number2}` : ''} | Email: ${lab.contact_email}`,
                                //     alignment: 'center',
                                //     fontSize: 10,
                                //     margin: [0, 3, 0, 0],
                                //     lineHeight: 1.1,
                                //     color: "#282B3E",
                                //     bold: true,
                                // },
                                // {
                                //     text: `Email: ${lab.contact_email}`,
                                //     alignment: 'center',
                                //     fontSize: 9,
                                //     margin: [0, 5, 0, 0],
                                //     lineHeight: 1.1
                                // }
                            ],
                            {
                                width: 80,
                                stack: [
                                    {
                                        text: `${currentPage} of ${pageCount}`,
                                        alignment: 'right',
                                        fontSize: 10,
                                        margin: [0, 10, 15, 0]
                                    },
                                    nablBuffer ? {
                                        width: 100,
                                        height: 100,
                                        image: nablBuffer,
                                        margin: [-25, 5, 0, 0]
                                    } : { text: '' },
                                ],
                            }
                        ],

                    },
                    {
                        canvas: [{
                            type: "line",
                            x1: 0,
                            y1: 0,
                            x2: 600,
                            y2: 0,
                            lineWidth: 2,
                            strokeColor: "black"
                        }],
                        margin: [0, 0, 0, 30]
                    },
                ];
            },
            footer: function (currentPage, pageCount) {
                let footerContent = [
                    {
                        canvas: [{
                            type: "line",
                            x1: 0,
                            y1: 0,
                            x2: 600,
                            y2: 0,
                            lineWidth: 1,
                            strokeColor: "black"
                        }],
                        margin: [0, 0, 0, 3]
                    },
                    {
                        alignment: "left",
                        columnGap: 5,
                        columns: [

                            lab_QR_LOGO_1_Buffer ? {
                                image: lab_QR_LOGO_1_Buffer,
                                width: 30
                            } : { text: "" },
                            {
                                text: footerLongText,
                                width: "auto",
                                fontSize: 8
                            },
                            lab_QR_LOGO_2_Buffer ? {
                                image: lab_QR_LOGO_2_Buffer,
                                width: 30
                            } : { text: "" },
                        ],
                        margin: [10, 5, 10, 5]
                    }
                ];

                if (currentPage === pageCount) {
                    const signatureSection = {
                        stack: [
                            {
                                id: 'signature_part',
                                alignment: 'justify',
                                columns: [
                                    {
                                        ul: [
                                            {
                                                text: `${calibrated_employee_name}`,
                                                listType: 'none',
                                                fontSize: 8,
                                            },
                                            {
                                                text: `${calibrated_employee_role}`,
                                                listType: 'none',
                                                fontSize: 8,
                                            },
                                            {
                                                text: 'Calibrated By',
                                                listType: 'none',
                                                fontSize: 10,
                                                bold: true,
                                            }
                                        ],
                                        alignment: 'center'
                                    },
                                    {
                                        ul: [
                                            {
                                                text: `${approved_employee_name}`,
                                                listType: 'none',
                                                fontSize: 8,
                                            },
                                            {
                                                text: `${approved_employee_role}`,
                                                listType: 'none',
                                                fontSize: 8,
                                            },
                                            {
                                                text: 'Authorized By',
                                                listType: 'none',
                                                fontSize: 10,
                                                bold: true,
                                            }
                                        ],
                                        alignment: 'center'
                                    },
                                ],
                                margin: [0, -50, 0, 5],
                            },
                            {
                                text: "*** End of Calibration Report ***",
                                alignment: "center",
                                fontSize: 10,
                                bold: true,
                                margin: [0, 0, 0, 2]
                            }
                        ]
                    };

                    footerContent.unshift(signatureSection);
                }

                return footerContent;
            },
            content: [
                {
                    text: 'CERTIFICATE OF CALIBRATION',
                    alignment: 'center',
                    fontSize: 16,
                    margin: [0, 5, 0, 5],
                },
                {
                    style: 'firstTable',
                    table: {
                        widths: ['*', '*', '*', '*'],
                        body: [
                            [
                                { text: "CERTIFICATE NUMBER:" },
                                { text: certificate_number || '-', alignment: 'center' },
                                { text: "DATE OF ISSUE:" },
                                { text: date_of_issue || '-', alignment: 'center' },
                            ],
                            [
                                { text: "ULR NUMBER:" },
                                { text: item?.url_number || '-', alignment: 'center' },
                                { text: "RECEIVED DATE:" },
                                { text: received_date || '-', alignment: 'center' },
                            ],
                            [
                                {
                                    text: [
                                        { text: 'CUSTOMER NAME & ADDRESS:', decoration: 'underline' },
                                        `\n${customer_name}`,
                                        `\n${customer_address}`
                                    ], rowSpan: 4, colSpan: 2, lineHeight: 1.5
                                },
                                {},
                                { text: "CAL.DATE:" },
                                { text: cal_date || '-', alignment: 'center' }
                            ],
                            [
                                {},
                                {},
                                { text: "Recommended Due Date:" },
                                { text: due_date || '-', alignment: 'center' }
                            ],
                            [
                                {},
                                {},
                                { text: 'SRF.NO' },
                                { text: srf || '-', alignment: 'center' }
                            ],
                            [
                                {},
                                {},
                                { text: 'CALIBRATED AT:' },
                                { text: 'LAB', alignment: 'center' }
                            ]
                        ]
                    }
                },
                {
                    style: 'secondTable',
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                { text: 'DUC DETAILS', alignment: 'center', decoration: 'underline' },
                            ]
                        ]
                    },
                    layout: {
                        hLineColor: function (i, node) {
                            return (i === node.table.body.length) ? 'white' : 'white';
                        },
                    }
                },
                {
                    style: 'thirdTable',
                    table: {
                        widths: ['25%', '25%', '25%', '25%'],
                        body: thirdTableBody
                    },
                    layout: {
                        hLineColor: function (i, node) {
                            return (i === node.table.body.length) ? 'white' : 'black';
                        },
                    }

                },
                {
                    style: "thirdTable",
                    table: {
                        widths: environmentalwidths,
                        layout: "noBorders",
                        body: environmentalbody
                    }
                },
                {
                    style: 'fivthTable',
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                { text: 'STANDARD DETAILS', alignment: 'center', decoration: 'underline' }
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
                    style: 'sixthTable',
                    table: {
                        widths: Array(iselectroParameters ? 9 : 8).fill(iselectroParameters ? '12.5%' : '14.28%'),
                        body: [
                            [
                                { text: 'DESCRIPTION', alignment: 'center', bold: true },
                                { text: 'MAKE', alignment: 'center', bold: true },
                                { text: 'MODEL', alignment: 'center', bold: true },
                                { text: 'SL.NO / ID.NO', alignment: 'center', bold: true },
                                { text: 'VALIDITY', alignment: 'center', bold: true },
                                { text: 'CERTIFICATE.NO', alignment: 'center', bold: true },
                                { text: 'TRACEABILITY', alignment: 'center', bold: true },
                                ...(iselectroParameters
                                    ? [{ text: 'Parameters', alignment: 'center', bold: true }]
                                    : [])
                            ],
                            ...standard_details_Table.map(item => {
                                const row = [
                                    { text: item.m_description || '-', alignment: 'center' },
                                    { text: item.m_make || '-', alignment: 'center' },
                                    { text: item.m_model || '-', alignment: 'center' },
                                    { text: item.m_identification_details ? `${item.m_serial_no}/${item.m_identification_details}` : item.m_serial_no, alignment: 'center' },
                                    { text: item.m_validity || '-', alignment: 'center' },
                                    { text: item.m_certificate_no || '-', alignment: 'center' },
                                    { text: item.m_traceability || '-', alignment: 'center' },
                                ];

                                if (iselectroParameters) {
                                    const params = Array.isArray(item.m_electro_parameter) ? item.m_electro_parameter : [];
                                    row.push({
                                        text: params.length > 0
                                            ? params.map((param, index) => `${index + 1}. ${param}`).join('\n')
                                            : '-',
                                        alignment: 'center'
                                    });
                                }


                                return row;
                            })
                        ]
                    }
                },
                {
                    style: 'eightthTable',
                    margin: [0, 5, 0, 0],
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [
                                {
                                    text: 'CALIBRATION RESULT', decoration: 'underline',
                                    fontSize: 8, alignment: 'center',
                                    bold: true
                                },
                                { text: `${disciplineName} - ${groupName}`, fontSize: 7, alignment: 'center', bold: true }
                            ]
                        ]
                    },
                    layout: 'noBorders'
                },
                ...imageContent,
                ...(Array.isArray(ExcelProcedureTable) ? ExcelProcedureTable : []),
                {
                    ...(remarks?.length > 0 && {
                        id: 'remark_part',
                        stack: [
                            {
                                text: 'REMARKS:',
                                decoration: 'underline',
                                margin: [0, 5, 0, 5]
                            },
                            {
                                style: 'remarksList',
                                ol: remarks,
                                lineHeight: 1.5
                            }
                        ]
                    })
                },
                {
                    text: '',
                    id: 'signature_spacer',
                    margin: [0, 20, 0, 20]
                },
            ],


            pageBreakBefore: function (currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
                if (currentNode.id === 'remark_part') {
                    if (currentNode.pageNumbers.length !== 1 || currentNode.pageNumbers[0] !== currentNode.pages) {
                        return true;
                    }
                }
                if (currentNode.id === 'signature_part') {
                    if (currentNode.pageNumbers.length !== 1 || currentNode.pageNumbers[0] !== currentNode.pages) {
                        return true;
                    }
                }
                return false;
            },


            defaultStyle: {
                columnGap: 0,
                font: 'Roboto',
            },

            styles: {
                firstTable: {
                    fontSize: 7
                },
                secondTable: {
                    fontSize: 7
                },
                thirdTable: {
                    fontSize: 7
                },
                fivthTable: {
                    fontSize: 7
                },
                fourthTable: {
                    fontSize: 7
                },
                sixthTable: {
                    fontSize: 7
                },
                seventhTable: {
                    fontSize: 7
                },
                ninethTable: {
                    fontSize: 6,
                    font: 'DejaVu',
                },
                remarks_style: {
                    fontSize: 7
                },
                remarksList: {
                    fontSize: 7
                },
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

        };

        const observationFileName = isValid(selectedSheet_Obs) ? await generateObservationReport(
            fs, path, printer,
            observationTable,
            observationTablelayout,
            item, masterResult,
            lab,
            certificate_number,
            calibrated_employee_name,
            approved_employee_name,
            instrumentDynamicRows,
            standard_details_Table,
            EParameterData?.dataValues
        ) : null

        // Create PDF
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks = [];

        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', async () => {
            const buffer = Buffer.concat(chunks);

            const todayDate = new Date().getTime();
            const fileName = `certificate-${todayDate}.pdf`;

            fs.writeFileSync(`./certificates/${fileName}`, buffer);

            const newCertificate = new Certificate({
                fileName: fileName,
                observationFileName: observationFileName || null,
                rstatus: 1,
                srfitemId: srf_item_id,
            });

            const result = await newCertificate.save();

            await Item.update({
                certificate_date: new Date().toLocaleDateString("en-IN").split('/').reverse().join('-'),
                certificate_no: certificate_number,
            }, {
                where: { srf_item_id },
            });

            const srfItemsQuery = await Item.findOne({
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
                            "contact_email", "email_smtp_server_host", "email_smtp_server_port", "sender_email", "sender_password"
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

            const pdfURL = path.join(__dirname, '../certificates', fileName);
            const masterURL = path.join(__dirname, '../master_certificates', m_certificate_filename);
            Customerportalcertificate(pdfURL, fileName, masterURL, m_certificate_filename, customer_info);
            const { msg, status } = await sendMail(srfItemsQuery, pdfURL);
            // Optional response control (define skip_response earlier if needed)
            // if (skip_response) return;
            res.set({ "Content-Type": "application/pdf", "Content-Length": buffer.length });
            return res.sendFile(pdfURL);
        });
        pdfDoc.end();

    } catch (err) {
        console.log(err);
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        error.path = "Certificate Create Error";
        return skip_response || errorHandler(error, req, res, next);
    }
}


const download = async (req, res, next) => {

    try {
        const { srf_item_id, type } = req.body;
        // ***  Query Certificate by srf_item_id ***
        let certificate = await Certificate.findOne({
            where: { srfitemId: srf_item_id },
            order: [['createdAt', 'DESC']]
        });
        const fileName = type === 'calibration' ? certificate?.fileName : certificate?.observationFileName;
        const docPath = type === 'calibration' ? path.join(__dirname, "..", "certificates", fileName) : path.join(__dirname, "..", "certificates/Observation", fileName);
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

const verify_certificate = async (req, res, next) => {

    try {
        const { srf_item_id } = req.body;

        let isGenerateCertificate = await ProcedureResult.findOne({
            where: { srf_item_id }
        });

        // Returns true if a record exists, false otherwise
        const isGenerated = !!isGenerateCertificate;


        // ***  Query Certificate by srf_item_id ***
        let certificate = await Certificate.findOne({
            where: { srfitemId: srf_item_id },
            order: [['createdAt', 'DESC']]
        });

        const check = certificate?.fileName ? true : false;

        const check_uncertainty = certificate?.fileName ? true : false;
        const check_observation = certificate?.observationFileName ? true : false

        return res.json({ isGenerateCertificate: isGenerated, check, check_uncertainty, check_observation });
    } catch (err) {
        console.log(err);
        let action = "Failed to verify certificate";
        const error = new Error(action);
        error.code = 500;
        error.path = "Verify Certificate";
        return errorHandler(error, req, res, next);
    }
}
/*** this function is reused in certificate_controller_for_sync.js ***/
const standard_details = async (master_list_equipments) => {

    let description = [];
    let make = [];
    let serial_no = [];
    let certificate_no = [];
    let validity = [];
    let traceability = [];
    let identification_details = [];
    let certificate_filename = [];
    let master_quantity = master_list_equipments.length

    master_list_equipments?.map((eachItem) => {

        //description?.push(eachItem.remark);
        description?.push(eachItem.name_of_equipment);
        make?.push(eachItem.make);
        serial_no?.push(eachItem.serial_no);
        certificate_no?.push(eachItem.calibration_certificate_no);

        if (eachItem?.calibration_valid_upto) {
            let vDate = new Date(eachItem?.calibration_valid_upto).toLocaleDateString('en-GB'); // Formats as DD/MM/YYYY
            validity?.push(vDate);
        }

        traceability?.push(eachItem.traceability);
        identification_details?.push(eachItem?.asset_number);
        certificate_filename?.push(eachItem.mastercertificate_filename);
    });

    const m_description = description?.join("/");
    const m_make = make?.join("/");
    const m_serial_no = serial_no?.join("/");
    const m_certificate_no = certificate_no?.join("/");
    const m_validity = validity?.join(",");
    const m_traceability = traceability?.join(",");
    const m_identification_details = identification_details?.join(",");
    const m_certificate_filename = certificate_filename?.join(",");

    return { m_description, m_make, m_serial_no, m_certificate_no, m_validity, m_traceability, m_identification_details, m_certificate_filename, master_quantity };
}

const standard_details_tableData = async (master_list_equipments) => {
    let result = [];

    master_list_equipments?.forEach((eachItem) => {
        let vDate = '-';
        if (eachItem?.calibration_valid_upto) {
            vDate = new Date(eachItem?.calibration_valid_upto).toLocaleDateString('en-GB'); // DD/MM/YYYY
        }

        result.push({
            m_description: eachItem.name_of_equipment || '-',
            m_make: eachItem.make || '-',
            m_model: eachItem.model_type || '-',
            m_serial_no: eachItem.serial_no || '-',
            m_certificate_no: eachItem.calibration_certificate_no || '-',
            m_validity: vDate || '-',
            m_traceability: eachItem.traceability || '-',
            m_identification_details: eachItem.asset_number,
            m_certificate_filename: eachItem.mastercertificate_filename || '-',
            m_electro_parameter: eachItem.electro_parameter || '-'
        });
    });

    return result;
}


function formatDynamicRowsFromOriginalRanges(rangesArray) {
    if (!Array.isArray(rangesArray)) return null;

    const keyValuePairs = [];

    for (const obj of rangesArray) {
        const uom = obj.InstrumentparameterUOM || '';
        for (const [key, value] of Object.entries(obj)) {
            if (key !== 'InstrumentUOMID' && key !== 'InstrumentparameterUOM') {
                keyValuePairs.push({
                    name: key.toUpperCase() + ':',
                    value: `${value} ${uom}`.trim()
                });
            }
        }
    }

    if (keyValuePairs.length === 0) return null;

    const rows = [];
    for (let i = 0; i < keyValuePairs.length; i += 2) {
        const row = [];

        const first = keyValuePairs[i];
        row.push({ text: first.name, bold: false });
        row.push({ text: first.value, alignment: 'center' });

        if (keyValuePairs[i + 1]) {
            const second = keyValuePairs[i + 1];
            row.push({ text: second.name, bold: false });
            row.push({ text: second.value, alignment: 'center' });
        } else {
            row.push({}, {});
        }

        rows.push(row);
    }

    return rows;
}


function buildRangeLcTypeRow(range, lc, type) {
    const rawCells = [];

    if (range) rawCells.push({ text: 'RANGE:' }, { text: range, alignment: 'center' });
    if (lc) rawCells.push({ text: 'L.C:', alignment: 'left' }, { text: lc, alignment: 'center' });
    if (type) rawCells.push({ text: 'TYPE:', alignment: 'left' }, { text: type, alignment: 'center' });

    const rows = [];

    for (let i = 0; i < rawCells.length; i += 4) {
        const row = rawCells.slice(i, i + 4);

        while (row.length < 4) {
            row.push({ text: '', border: [false, false, false, false] });
        }

        rows.push(row);
    }

    return rows;
}


const convertFilepathtoBlob = async (filePath, originalFileName) => {
    try {
        const data = await fs.promises.readFile(filePath);
        const extension = filePath.split('.').pop().toLowerCase();

        const types = {
            pdf: 'application/pdf',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
        };

        if (!types[extension]) {
            throw new Error(`Unsupported file type: ${extension}`);
        }

        const blob = new Blob([data], { type: types[extension] });
        return new File([blob], originalFileName, { type: types[extension] });

    } catch (err) {
        console.error('Error reading file:', err);
    }
}

const Customerportalcertificate = async (pdfURL, fileName, masterURL, m_certificate_filename, customer_info) => {
    try {
        const formData = new FormData();
        formData.append('file', await convertFilepathtoBlob(pdfURL, fileName));
        if (fs.existsSync(masterURL) && m_certificate_filename)
            formData.append('masterfile', await convertFilepathtoBlob(masterURL, m_certificate_filename));

        Object.entries(customer_info).forEach(([key, value]) => {
            formData.append(key, value);
        });

        let response_2 = await fetch(CUSTOMER_PORTAL_SERVER + '/api/upload/create', { method: 'POST', body: formData });
        response_2 = await response_2.json();
    }
    catch (err) {
        console.error('path: Customer portal certificate', err)
    }

}

exports.generate = generate;
exports.download = download;
exports.verify_certificate = verify_certificate;
exports.standard_details = standard_details;