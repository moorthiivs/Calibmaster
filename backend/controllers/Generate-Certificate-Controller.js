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
const { CertificateFormat } = require("../models");
const Customer = require("../models").customer;
const CMSsettingsPermissions = require("../models").cmssettings_permissions;
const PdfPrinter = require('pdfmake');
const moment = require('moment-timezone');
const archiver = require("archiver");
const signatureDate = moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm A');
const { format } = require('date-fns')

const { parse, subDays, isAfter, isBefore, isEqual } = require("date-fns");

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
    Calibri: {
        normal: path.join(__dirname, '../fonts/calibri/Calibri.ttf'),
        bold: path.join(__dirname, '../fonts/calibri/Calibribold.ttf'),
        italics: path.join(__dirname, '../fonts/calibri/Calibriitalic.ttf'),
        bolditalics: path.join(__dirname, '../fonts/calibri/Calibribolditalic.ttf'),
    }
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
const generateAndAssignCertificateNo = require("../utils/generateAndAssignCertificateNo");
const { log } = require("winston");

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

const generate = async (req, res, next) => {

    try {

        const { lab_id, srf_id, srf_item_id, customer_info, reportGenerateDate } = req.body;

        const skip_response = req.body?.skip_response || false;

        const draftMailSend = req.body.sendDraft || false;

        //const certificate_number = new Date().getTime();

        const Certformat = await CertificateFormat.findOne({
            where: { lab_id },
        });

        if (!Certformat) {
            return res.status(404).json({ message: "Certificate Number format not found" });
        }

        let cmssettings_permissions_data = await CMSsettingsPermissions.findAll({
            where: { lab_id: lab_id },
            order: [
                ['cmssetting_permission_id', 'ASC'],
            ],
        });

        const cmsSettingsMap = {};
        cmssettings_permissions_data.forEach(setting => {
            cmsSettingsMap[setting.setting_name] = setting;
        });

        const isEnabled = (name) => cmsSettingsMap[name]?.setting_value === 'YES' && cmsSettingsMap[name]?.is_enable === true;

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
            where: {
                lab_id: `'${lab_id}'`
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

        const cert_pagemargin = {
            pageMargin: Styles?.[selectedSheet_Cert.value]?.pageMargin,
            pageOrientation: Styles?.[selectedSheet_Cert.value]?.pageOrientation,
            printFontSize: Styles?.[selectedSheet_Cert.value]?.printFontSize
        };

        const obs_pagemargin = {
            pageMargin: Styles?.[selectedSheet_Obs.value]?.pageMargin,
            pageOrientation: Styles?.[selectedSheet_Obs.value]?.pageOrientation,
            printFontSize: Styles?.[selectedSheet_Obs.value]?.printFontSize
        };

        // ── Page margin settings: read from Styles saved per-sheet in DB ──
        const certSettings = resolveSheetPageSettings(Styles, selectedSheet_Cert, cert_pagemargin);

        // Observation sheet uses ITS OWN saved settings (independent of cert)
        const obsSettings = resolveSheetPageSettings(Styles, selectedSheet_Obs, obs_pagemargin);

        const ExcelProcedureTablelayout = {
            hLineWidth: (i, node) => {
                if (i === 0) return 0.5;
                return 0.5;
            },
            vLineWidth: () => 0.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 2, paddingRight: () => 2, paddingTop: () => 3, paddingBottom: () => 3
        };

        const observationTablelayout = {
            hLineWidth: (i, node) => {
                if (i === 0) return 0.5;
                return 0.5;
            },
            vLineWidth: () => 0.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 2, paddingRight: () => 2, paddingTop: () => 3, paddingBottom: () => 3
        };

        // Generate table content for both certificate and observation
        const ExcelProcedureTable = await generatePdfFromSheet(excelData, mergedCells, Styles, selectedSheet_Cert, decimalPoint, ExcelProcedureTablelayout, certSettings.fontSize, certSettings);

        const observationTable = isValid(selectedSheet_Obs) ? await generatePdfFromSheet(excelData, mergedCells, Styles, selectedSheet_Obs, decimalPoint, observationTablelayout, obsSettings.fontSize, obsSettings) : null

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

        const calibrationAt = item?.calibrationAt || 'Lab'
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

        const condition = item?.remarks;


        // date_of_issue → if reportGenerateDate exists, format it, else take today's date
        let date_of_issue = reportGenerateDate
            ? format(new Date(reportGenerateDate), "dd-MM-yyyy")
            : format(new Date(), "dd-MM-yyyy");

        // received_date
        let received_date = item?.srf?.customer_dc_date
            ? format(new Date(item.srf.customer_dc_date), "dd-MM-yyyy")
            : "--";

        // cal_date
        let cal_date = item?.calibration_done_date
            ? format(new Date(item.calibration_done_date), "dd-MM-yyyy")
            : "--";

        // due_date
        let due_date = item?.calibration_due_date
            ? format(new Date(item.calibration_due_date), "dd-MM-yyyy")
            : "--";


        // ***  Query Master Result List  *** 
        let masterResult = await masterResultTable.findOne({
            where: { lab_id, srf_id, srf_item_id },
            include: ["calibrated_employee_master", "approved_employee_master", "authorizedby_employee_master"]
        });
        // return res.json(masterResult);

        if (!masterResult) {
            let action = "Master Result is not available";
            const error = new Error(action);
            error.code = 501;
            return skip_response || errorHandler(error, req, res, next);
        }

        // ***  Set duc details table data *** 
        const description = item?.intrument_type?.instrument?.instrument_name;
        const make = item?.make;
        const model = item?.model;
        const slNo = item?.serial_no;
        const idNo = item?.identification_details;
        let iselectroParameters = false
        const type = item?.instrument_type_at_calibration || item?.intrument_type?.type;
        //const instrumentDynamicRows = formatDynamicRowsFromOriginalRanges(item?.intrument_type?.ranges, masterResult.witnessed_by);
        const instrumentDynamicRows = formatDynamicRowsFromOriginalRanges(item?.ranges, masterResult.witnessed_by, isEnabled, type, description);
        const range = item?.intrument_type?.range_minimum ?? ''
        const lc = item?.intrument_type?.least_count ?? ''



        // *** Set standards details table data *** 
        const ulr_number = masterResult?.ulr_number;
        const procedure_desc = masterResult?.description || '';
        const ref_std = masterResult?.ref_std ? `This Method is based on ${masterResult.ref_std}` : '';
        const calibration_procedure_name = masterResult?.calibration_procedure || '';


        const temperature = isValid(masterResult?.temperature?.mean) ? masterResult?.temperature?.mean + '°C' : 'N/A';
        const humidity = isValid(masterResult?.humidity?.mean) ? masterResult?.humidity?.mean + '%' : 'N/A';
        const AtmosphericPressure = masterResult?.atmospheric_pressure
        const Frequency = masterResult?.frequency
        const remark = masterResult?.remarks;
        const remarks = Array.isArray(remark) ? remark.map(r => r.replace(/\s+/g, ' ').trim()) : [];


        const calibration_procedure = [procedure_desc, ref_std, calibration_procedure_name]
            .filter(part => part.trim() !== '')
            .join(' As per ');

        // *** Create Format for Master list Equipments ***
        let masterListEquipment = await standard_details(masterResult?.master_list_equipments);


        let standard_details_Table = await standard_details_tableData(masterResult?.master_list_equipments)


        const { m_description, m_make, m_serial_no, m_certificate_no, m_validity, m_traceability, m_identification_details, m_certificate_filename, master_quantity } = masterListEquipment;
        // return res.json(masterListEquipment);

        const srf = item.srf.dataValues.srf_number;

        const currentYear = new Date().getFullYear();  // Get current year (e.g., 2025)

        const prevYear = currentYear - 1;             // Get previous year (e.g., 2024)

        const yearRange = `${prevYear.toString().slice(-2)}-${currentYear.toString().slice(-2)}`;

        //const certificate_number = await generateAndAssignCertificateNo(item, srf, itemCount, CertificateFormat, Item)

        const certificate_number = await generateAndAssignCertificateNo({
            item,
            srf,
            itemCount,
            //Certformat, // this should be a CertificateFormat row, with `required_fields` and `format_template`
            //CertificateFormat, // this should be the Sequelize model
            Item, // this should be the Sequelize model
            //Customer,
            labId: lab_id
        });


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

        let authorized_employee_master = await masterResult.authorizedby_employee_master;
        let authorized_employee_name = authorized_employee_master?.employee_full_name;
        let authorized_employee_role = authorized_employee_master?.employee_role;
        let authorized_employee_signature = authorized_employee_master?.employee_signature;

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


        let environmentalbody = [];

        // Default values
        const defaultTemp = "20 ± 2°C";
        const defaultRH = "50 ± 10%";


        // let row1 = [
        //     { text: 'TEMP', alignment: 'center', bold: true },
        //     { text: defaultTemp, alignment: 'center' },
        //     { text: 'RH', alignment: 'center', bold: true },
        //     { text: defaultRH, alignment: 'center' },
        // ];


        // let row2 = [
        //     { text: 'ACTUAL', alignment: 'center', bold: true },
        //     { text: `${temperature || '-'}`, alignment: 'center' },
        //     { text: 'ACTUAL', alignment: 'center', bold: true },
        //     { text: `${humidity || '-'}`, alignment: 'center' },
        // ];
        // Row 1
        let row1 = [
            {
                text: 'ENVIRONMENTAL\nCONDITIONS',
                rowSpan: 2,
                alignment: 'center',
                bold: true,
                margin: [0, 5, 0, 5]
            },
            { text: 'TEMP', alignment: 'center', bold: true, margin: [0, 2, 0, 2] },
            { text: defaultTemp, alignment: 'center', margin: [0, 2, 0, 2] },
            { text: 'RH', alignment: 'center', bold: true, margin: [0, 2, 0, 2] },
            { text: defaultRH, alignment: 'center', margin: [0, 2, 0, 2] }
        ];

        // Row 2
        let row2 = [
            {}, // required empty cell because of rowSpan
            { text: 'ACTUAL', alignment: 'center', bold: true, },
            { text: `${temperature || '-'}`, alignment: 'center', },
            { text: 'ACTUAL', alignment: 'center', bold: true, },
            { text: `${humidity || '-'}`, alignment: 'center', }
        ];

        if (AtmosphericPressure) {
            row1.push(
                { text: 'ATMOSPHERIC PRESSURE (mbar)', alignment: 'center', bold: true },
                { text: AtmosphericPressure, alignment: 'center' }
            );
            row2.push(
                { text: 'ACTUAL', alignment: 'center', bold: true },
                { text: `${AtmosphericPressure || '-'}`, alignment: 'center' }
            );
        }

        if (Frequency) {
            row1.push(
                { text: 'FREQUENCY (Hz)', alignment: 'center', bold: true },
                { text: Frequency, alignment: 'center' }
            );
            row2.push(
                { text: 'ACTUAL', alignment: 'center', bold: true },
                { text: `${FrequencyActual || '-'}`, alignment: 'center' }
            );
        }

        const totalCols = row1.length;

        // const headerRow = [
        //     {
        //         text: 'ENVIRONMENTAL CONDITIONS',
        //         alignment: 'center',
        //         colSpan: totalCols,
        //         bold: true
        //     },
        //     ...Array(totalCols - 1).fill({})
        // ];

        //environmentalbody.push(headerRow);
        environmentalbody.push(row1);
        environmentalbody.push(row2);

        // equal widths
        let environmentalwidths = Array(totalCols).fill("*");

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
            ...(instrumentDynamicRows || buildRangeLcTypeRow(range, lc, type, masterResult, isEnabled)),
            // [
            //     { text: 'CALIBRATION PROCEDURE & REF.STD:', alignment: 'left', colSpan: 2 },
            //     {},
            //     { text: `${capitalizeEachWord(calibration_procedure) || '-'}`, alignment: 'center', colSpan: 2 },
            //     {}
            // ],
            [
                { text: 'CALIBRATION PROCEDURE :', alignment: 'left', bold: true },

                {
                    colSpan: 3,
                    alignment: 'left',
                    stack: [
                        capitalizeEachWord(calibration_procedure) || '-'
                    ]
                },
                {},
                {}
            ]
        ];


        const notes = [
            "This calibration certificate is valid only for the specific item submitted for calibration.",
            `Reproduction of this certificate, except in full, requires prior written approval from ${capitalizeFirstLetter(lab?.lab_name)}.`,
            "The calibration results reported are valid only under the stated conditions of measurement.",
            "This is a computer-generated certificate and has been digitally signed by an authorized signatory."
        ];


        const Dc_Number = await item?.srf?.dataValues?.customer_dc ?? item?.dispatch_dc ?? "N/A";


        const format_no_cert = Certformat?.format_no?.certificate_format_no
            ? (item?.labtype === "NABL"
                ? Certformat.format_no.certificate_format_no.nabl
                : Certformat.format_no.certificate_format_no.nonNabl)
            : item?.labtype === "NABL"
                ? "LAB/F/25/ Rev:07"
                : "LAB/F/26/ Rev:01";

        const format_no_obser = Certformat?.format_no?.observation_format_no
            ? (item?.labtype === "NABL"
                ? Certformat.format_no.observation_format_no.nabl
                : Certformat.format_no.observation_format_no.nonNabl)
            : item?.labtype === "NABL"
                ? "LAB/F/25A/ Rev:04"
                : "LAB/F/26A/ Rev:01";

        const isNABL = item?.labtype === "NABL" ? true : false

        const headerMargin = item?.labtype === "NABL" ? 93 : 88
        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [10, headerMargin, 10, 127],
            background: (currentPage, pageSize) => {
                return [
                    {
                        canvas: [
                            { type: 'line', x1: 10, y1: 10, x2: 585, y2: 10, lineWidth: 2.5 },
                            { type: 'line', x1: 10, y1: 10, x2: 10, y2: 830, lineWidth: 2.5 },
                            { type: 'line', x1: 10, y1: 830, x2: 585, y2: 830, lineWidth: 2.5 },
                            { type: 'line', x1: 585, y1: 10, x2: 585, y2: 830, lineWidth: 2.5 }
                        ]
                    }
                    // , {
                    //     image: labLogo_1_Buffer,
                    //     width: 200,
                    //     height: 300,
                    //     opacity: 0.1,
                    //     absolutePosition: {
                    //         x: (pageSize.width - 200) / 2,
                    //         y: (pageSize.height - 300) / 2
                    //     }
                    // }
                ]
            },
            header: function (currentPage, pageCount) {
                if (isNABL) {
                    return [
                        {
                            table: {
                                widths: [100, '*', 110],
                                body: [[
                                    // LEFT BOX (NABL logo)
                                    {
                                        stack: [
                                            nablBuffer ? {
                                                image: nablBuffer,
                                                fit: [80, 80],
                                                alignment: 'center',
                                                margin: [0, 0, 0, 0]
                                            } : { text: '' },
                                        ],
                                        alignment: 'center',
                                        border: [true, true, true, true],
                                        margin: [0, 0, 0, 0]
                                    },
                                    // CENTER BOX (Title)
                                    {
                                        text: "CALIBRATION CERTIFICATE",
                                        alignment: 'center',
                                        fontSize: 16,
                                        bold: true,
                                        margin: [0, 25, 0, 25],
                                        border: [true, true, true, true]
                                    },
                                    // RIGHT BOX (Company Logo + Plant)
                                    {
                                        stack: [
                                            labLogo_1_Buffer ? {
                                                image: labLogo_1_Buffer,
                                                fit: [120, 120],
                                                alignment: 'center',
                                                margin: [0, 20, 0, 2]
                                            } : { text: '' },
                                            lab?.address1 ? {
                                                text: lab.address1,
                                                alignment: 'center',
                                                fontSize: 9,
                                                margin: [0, 2, 0, 0],
                                            } : { text: '' }
                                        ],
                                        alignment: 'center',
                                        border: [true, true, true, true],
                                        margin: [0, 5, 0, 5]
                                    }
                                ]]
                            },
                            layout: {
                                hLineWidth: function () { return 0.5; }, // 0.9
                                vLineWidth: function () { return 0.5; }, // 0.9
                                hLineColor: function () { return 'black'; },
                                vLineColor: function () { return 'black'; }
                            },
                            margin: [10, 10, 10, 0]
                        }
                    ];
                } else {
                    return [
                        {
                            table: {
                                widths: ['*', 135.4],
                                body: [[
                                    {
                                        text: "CALIBRATION CERTIFICATE",
                                        alignment: 'center',
                                        fontSize: 16,
                                        bold: true,
                                        margin: [80, 25, 0, 25],
                                        border: [false, true, false, true]
                                    },
                                    {
                                        stack: [
                                            labLogo_1_Buffer ? {
                                                image: labLogo_1_Buffer,
                                                fit: [100, 100],
                                                alignment: 'center',
                                                margin: [0, 20, 0, 2]
                                            } : { text: '' },
                                            lab?.address1 ? {
                                                text: lab.address1,
                                                alignment: 'center',
                                                fontSize: 9,
                                                margin: [0, 5, 0, 0]
                                            } : { text: '' }
                                        ],
                                        border: [true, true, false, true],
                                        alignment: 'center',
                                        margin: [0, 5, 0, 5]
                                    }
                                ]]
                            },
                            layout: {
                                hLineWidth: function () { return 0.5; }, // 0.9
                                vLineWidth: function () { return 0.5; }, // 0.9
                                hLineColor: function () { return 'black'; },
                                vLineColor: function () { return 'black'; }
                            },
                            margin: [10, 10, 10, 0]
                        }
                    ];
                }
            },
            footer: function (currentPage, pageCount) {
                const qrBuffer = lab_QR_LOGO_2_Buffer || lab_QR_LOGO_1_Buffer;

                const signatureTable = {
                    table: {
                        widths: ['16.6%', '16.6%', '16.6%', '16.6%', '16.6%', '16.6%'],
                        body: [
                            [
                                { text: 'Calibrated By', alignment: 'center', fontSize: 8, },
                                { text: '', alignment: 'center' },
                                { text: 'Reviewd by', alignment: 'center', fontSize: 8, },
                                { text: '', alignment: 'center' },
                                { text: 'Authorized By', alignment: 'center', fontSize: 8, },
                                { text: '', alignment: 'center' }
                            ],
                            [
                                { text: 'Name', alignment: 'center', fontSize: 8, },
                                { text: calibrated_employee_name, alignment: 'center', fontSize: 8, },
                                { text: 'Name', alignment: 'center', fontSize: 8, },
                                { text: approved_employee_name, alignment: 'center', fontSize: 8, },
                                { text: 'Name', alignment: 'center', fontSize: 8, },
                                { text: authorized_employee_name || "-", alignment: 'center', fontSize: 8, }
                            ]
                        ]
                    },
                    layout: {
                        //hLineWidth: function (i, node) { return 0.9; },
                        hLineWidth: function (i, node) {
                            if (i === 0) return 0.5;
                            if (i === node.table.body.length) return 0.1;
                            return 0.5; // 0.9
                        },
                        vLineWidth: function (i, node) { return 0.3; }, // 0.9
                        hLineColor: function () { return 'black'; },
                        vLineColor: function () { return 'black'; }
                    },
                    margin: [10, 0, 8, 0]
                };

                const addressStack = {
                    stack: [
                        { text: lab?.lab_name || '', alignment: 'center', fontSize: 9, bold: true, margin: [20, 0, 0, 1] },
                        { text: `${lab?.address2} ${lab?.city} - ${lab?.pincode}`, alignment: 'center', fontSize: 8, margin: [20, 1, 0, 1] },
                        { text: `Ph: ${lab?.contact_number1} / ${lab?.contact_number2}, `, alignment: 'center', fontSize: 8, margin: [20, 1, 0, 1] },
                        { text: `E-mail id: ${lab?.contact_email}`, alignment: 'center', fontSize: 8, margin: [20, 1, 0, 0] }
                    ]
                };

                const qrCell = isNABL && qrBuffer
                    ? { image: qrBuffer, width: 50, alignment: 'center', margin: [0, 0, 0, 0] }
                    : { text: '', width: 50 };

                const footerTable = {
                    table: {
                        widths: isNABL ? ['*', 60] : ['*'],
                        body: isNABL
                            ? [[addressStack, qrCell]]
                            : [[addressStack]]
                    },
                    layout: {
                        hLineWidth: function (i, node) { return 0.5; }, // 0.9
                        vLineWidth: function (i, node) {
                            return (i === 1) ? 0 : 0.5;
                        },
                        hLineColor: function () { return 'black'; },
                        vLineColor: function () { return 'black'; },
                        paddingLeft: function () { return 5; },
                        paddingRight: function () { return 5; },
                        paddingTop: function () { return 5; },
                        paddingBottom: function () { return 5; }
                    },
                    margin: [10, 0, 10, 0]
                };

                const out = [signatureTable, footerTable];

                const formattedCurrent = String(currentPage).padStart(2, '0');
                const formattedTotal = String(pageCount).padStart(2, '0');

                if (currentPage === pageCount) {
                    out.push({
                        table: {
                            widths: ['*'],
                            body: [[
                                { text: "***End of Certificate***", alignment: "center", fontSize: 9, bold: true },
                            ]]
                        },
                        layout: 'noBorders',
                        margin: [isNABL ? 0 : 40, 0, 26, 0]
                    });
                }

                out.push({
                    table: {
                        widths: ['*', 'auto'],
                        body: [[
                            { text: `Page ${formattedCurrent}  of  ${formattedTotal}`, alignment: "center", fontSize: 8 },
                            { text: format_no_cert, alignment: "right", fontSize: 8 },
                        ]]
                    },
                    layout: 'noBorders',
                    margin: [isNABL ? 60 : 95, 0, isNABL ? 20 : 13, 15]
                });
                return out;
            },
            content: [
                {
                    style: 'firstTable',
                    table: {
                        widths: ['*', '*', '*', '*'],
                        body: [
                            [
                                { text: "CERTIFICATE NUMBER:", border: [true, false, true, true], },
                                { text: certificate_number || '-', alignment: 'center', border: [true, false, true, true], },
                                { text: "DATE OF ISSUE:", border: [true, false, true, true], },
                                { text: date_of_issue || '-', alignment: 'center', border: [true, false, true, true] },

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
                                        { text: 'CUSTOMER NAME & ADDRESS:', bold: true },
                                        `\n${customer_name}`,
                                        `\n${customer_address}`
                                    ],
                                    rowSpan: 3,
                                    colSpan: 2,
                                    lineHeight: 1
                                },
                                {},
                                { text: "CAL.DATE:" },
                                { text: cal_date || '-', alignment: 'center' }
                            ],
                            // [
                            //     {},
                            //     {},
                            //     { text: "Due Date of Calibration:" },
                            //     { text: due_date || '-', alignment: 'center' }
                            // ],
                            [
                                {},
                                {},
                                { text: 'SRF.NO:' },
                                { text: srf || '-', alignment: 'center' }
                            ],
                            [
                                {},
                                {},
                                { text: `SANSERA LAB ID NO:` },
                                { text: item?.inward_no || '-', alignment: 'center' }
                            ],
                            [
                                { text: 'Customer Reference No:' },
                                //{ text: isValid(item?.dispatch_dc) ? item?.dispatch_dc : 'N/A', alignment: 'center' },
                                { text: Dc_Number, alignment: 'center' },
                                { text: 'CALIBRATED AT:' },
                                { text: calibrationAt, alignment: 'center' }
                            ],
                            [
                                { text: "DISCIPLINE:", },
                                { text: disciplineName, alignment: "center", lineHeight: 1 },
                                { text: "GROUP:" },
                                { text: groupName, alignment: "center", lineHeight: 1 }
                            ],
                        ]
                    },
                    layout: {
                        hLineWidth: function (i, node) {
                            if (i === 0) return 0.1;
                            if (i === node.table.body.length) return 0.5;
                            return 0.5;
                        },
                        vLineWidth: function () { return 0.5; },
                        hLineColor: function () { return 'black'; },
                        vLineColor: function () { return 'black'; }
                    }



                },
                {
                    style: 'secondTable',
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                { text: 'DUC DETAILS', alignment: 'center', bold: true },
                            ]
                        ]
                    },
                    layout: {
                        hLineWidth: function () { return 0.5; },
                        vLineWidth: function () { return 0.5; },
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
                        hLineWidth: function () { return 0.5; },
                        vLineWidth: function () { return 0.5; },
                        hLineColor: function (i, node) {
                            return (i === node.table.body.length) ? 'white' : 'black';
                        },
                    }

                },
                {
                    style: 'fivthTable',
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                { text: 'STANDARD DETAILS', alignment: 'center', bold: true }
                            ]
                        ],

                    },
                    layout: {

                        hLineWidth: function () { return 0.5; },
                        vLineWidth: function () { return 0.5; },
                        hLineColor: function (i, node) {
                            return (i === node.table.body.length) ? 'white' : 'black';
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
                                { text: 'MAKE / MODEL', alignment: 'center', bold: true },
                                { text: 'Calibration Agency', alignment: 'center', bold: true },
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
                                    //{ text: item.m_description || '-', alignment: 'center' },
                                    { text: `${item.m_description || '-'} - ${item.m_identification_details || '-'}`, alignment: 'center' },
                                    { text: `${item.m_make || '-'} / ${item.m_model || '-'}`, alignment: 'center' },
                                    { text: item.m_calibration_agency || '-', alignment: 'center' },
                                    { text: `${item.m_serial_no || "-"} / ${item.m_identification_details || "-"}`, alignment: 'center' },
                                    {
                                        text: item.m_validity || '-', alignment: 'center', fillColor: (() => {
                                            if (!item.m_validity) return null;

                                            const today = new Date();
                                            const validityDate = new Date(item.m_validity.split('/').reverse().join('-'));
                                            return validityDate < today ? '#ff0000' : null;
                                        })()
                                    },
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
                    },
                    layout: {
                        hLineWidth: function () { return 0.5; },
                        vLineWidth: function () { return 0.5; },
                        hLineColor: function (i, node) {
                            return (i === node.table.body.length) ? 'white' : 'black';
                        },
                    }
                },
                {
                    style: "thirdTable",
                    table: {
                        widths: environmentalwidths,
                        body: environmentalbody
                    },
                    margin: [0, 0, 0, 0],
                    layout: {
                        hLineWidth: function () { return 0.5; },
                        vLineWidth: function () { return 0.5; },
                    }
                },
                ...imageContent,
                // ── Excel data block: user-saved margins apply ONLY to this section ──
                ...(
                    Array.isArray(ExcelProcedureTable) && ExcelProcedureTable.length > 0
                        ? [{
                            stack: ExcelProcedureTable,
                            margin: [certSettings.marginLeft, certSettings.marginTop, certSettings.marginRight, certSettings.marginBottom]
                        }]
                        : []
                ),
                {
                    ...(remarks?.length > 0 && {
                        id: 'remark_part',
                        stack: [
                            {
                                text: 'REMARKS:',
                                bold: true,
                                decoration: 'underline',
                                margin: [3, 1, 0, 1]
                            },
                            {
                                style: 'remarksList',
                                ol: remarks,
                                lineHeight: 1.5,
                                margin: [3, 0, 1.3, 0]
                            }
                        ]
                    })
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
                font: 'Calibri',
                fontSize: 8.5
            },

            styles: {
                ninethTable: {
                    font: 'Calibri',
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
            authorized_employee_name,
            instrumentDynamicRows,
            standard_details_Table,
            EParameterData?.dataValues,
            format_no_obser,
            imageToBuffer,
            obsSettings,
            false
        ) : null


        const draftDocDefinition = {
            ...docDefinition,
            header: null, // remove header
            footer: null, // remove footer,
            pageMargins: [20, 20, 20, 70],
        };

        if (draftMailSend) {
            delete draftDocDefinition.header;
            delete draftDocDefinition.footer;
        }




        // Create PDF
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks = [];

        pdfDoc.on("data", chunk => chunks.push(chunk));
        pdfDoc.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            const todayDate = Date.now();
            const fileName = `certificate-${todayDate}.pdf`;

            // Save final certificate
            fs.writeFileSync(`./certificates/${fileName}`, buffer);


            // Fetch SRF & Lab details (for sending mail)
            const srfItemsQuery = await Item.findOne({
                where: { srf_item_id },
                attributes: [
                    "serial_no", "identification_details", "calibration_done_date",
                    "url_number", "certificate_date", "calibration_due_date", "calibration_remainder_date_1",
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
                        attributes: ["srf_number", "contact_name", "contact_email"]
                    }
                ]
            });

            let draftPDffilename;
            // Handle draft certificate (optional)
            if (draftMailSend) {
                const draftFileName = `certificate-draft-${todayDate}.pdf`;
                draftPDffilename = draftFileName
                const draftFolderPath = path.join(__dirname, "../certificates/Draft");

                // Ensure draft folder exists
                if (!fs.existsSync(draftFolderPath)) {
                    fs.mkdirSync(draftFolderPath, { recursive: true });
                }

                const draftChunks = [];
                const draftPdf = printer.createPdfKitDocument(draftDocDefinition);

                draftPdf.on("data", c => draftChunks.push(c));
                draftPdf.on("end", async () => {
                    const draftBuffer = Buffer.concat(draftChunks);
                    const draftPDFPath = path.join(draftFolderPath, draftFileName);

                    fs.writeFileSync(draftPDFPath, draftBuffer);

                    // Send draft mail
                    const { msg } = await sendMail(srfItemsQuery, draftPDFPath);
                });

                draftPdf.end();
            }


            // Save in DB
            const newCertificate = new Certificate({
                fileName,
                observationFileName: observationFileName || null,
                rstatus: 1,
                srfitemId: srf_item_id,
                draftFileName: draftPDffilename || null
            });
            await newCertificate.save();

            // Update Item details
            await Item.update({
                certificate_date: new Date().toISOString().split("T")[0],
                certificate_no: certificate_number,
            }, { where: { srf_item_id } });

            // Final certificate email
            const pdfURL = path.join(__dirname, "../certificates", fileName);
            const masterURL = path.join(__dirname, "../master_certificates", m_certificate_filename);

            Customerportalcertificate(pdfURL, fileName, masterURL, m_certificate_filename, customer_info);
            //const { msg } = await sendMail(srfItemsQuery, pdfURL);

            if (skip_response) return;
            res.set({ "Content-Type": "application/pdf", "Content-Length": buffer.length });
            return res.send(pdfURL);
        });

        pdfDoc.end();

    } catch (err) {
        console.log(err);
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        error.path = "Certificate Create Error";
        //return skip_response || errorHandler(error, req, res, next);
        return errorHandler(error, req, res, next);
    }
}

const download = async (req, res, next) => {
    try {
        const { srf_item_id, type } = req.body;

        // *** Query Certificate by srf_item_id ***
        let certificate = await Certificate.findOne({
            where: { srfitemId: srf_item_id },
            order: [["createdAt", "DESC"]],
        });

        if (!certificate) {
            throw new Error("Certificate not found");
        }

        let fileName, docPath;

        if (type === "calibration") {
            fileName = certificate?.fileName;
            docPath = path.join(__dirname, "..", "certificates", fileName);
        } else if (type === "observation") {
            fileName = certificate?.observationFileName;
            docPath = path.join(__dirname, "..", "certificates", "Observation", fileName);
        } else if (type === "draft") {
            fileName = certificate?.draftFileName;
            docPath = path.join(__dirname, "..", "certificates", "Draft", fileName);
        } else {
            throw new Error("Invalid type. Allowed: calibration, observation, draft");
        }

        if (!fileName) {
            throw new Error(`File not found for type: ${type}`);
        }

        return res.sendFile(docPath);
    } catch (err) {
        console.log(err);
        let action = "Failed to download certificate";
        const error = new Error(action);
        error.code = 500;
        error.path = "Download Certificate";
        return errorHandler(error, req, res, next);
    }
};

const bulkDownload_Certificate = async (req, res, next) => {
    try {
        const { srf_id, lab_id } = req.query;

        // Step 1: Get all srf items for this srf_id
        const items = await Item.findAll({
            where: { srf_id },
            attributes: ["srf_item_id"],
        });

        if (!items || items.length === 0) {
            return res.status(404).json({ message: "No items found for given SRF ID" });
        }

        const srfItemIds = items.map(i => i.srf_item_id);

        // Step 2: Get all certificates for those items
        const certificates = await Certificate.findAll({
            where: { srfitemId: srfItemIds },
            attributes: ["fileName", "observationFileName"],
        });

        // Count certificates and observations
        const certificateCount = certificates.filter(c => c.fileName).length;
        const observationCount = certificates.filter(c => c.observationFileName).length;

        if (certificateCount === 0 && observationCount === 0) {
            return res.status(400).json({
                message: `No certificates or observation files available for SRF ID ${srf_id}`
            });
        }

        // Step 3: Create a zip archive
        res.setHeader("Content-Type", "application/zip");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=srf_${srf_id}_certificates.zip`
        );

        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.pipe(res);

        // Step 4: Add files to zip
        for (const cert of certificates) {
            if (cert.fileName) {
                const certPath = path.join(__dirname, "..", "certificates", cert.fileName);
                if (fs.existsSync(certPath)) {
                    archive.file(certPath, { name: `Certificates/${cert.fileName}` });
                }
            }

            if (cert.observationFileName) {
                const obsPath = path.join(__dirname, "..", "certificates", "Observation", cert.observationFileName);
                if (fs.existsSync(obsPath)) {
                    archive.file(obsPath, { name: `Observations/${cert.observationFileName}` });
                }
            }
        }

        await archive.finalize();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error generating bulk download", error });
    }
};

const verify_certificate = async (req, res, next) => {

    try {
        const { lab_id, srf_id, srf_item_id } = req.body;

        let isGenerateCertificate = await ProcedureResult.findOne({
            where: { srf_item_id }
        });

        let calibration_done = await Item.findOne({
            where: { srf_item_id },
            attributes: ["calibration_done_date"],
        });

        let cmssettings_permissions_data = await CMSsettingsPermissions.findAll({
            where: { lab_id: lab_id },
            order: [
                ['cmssetting_permission_id', 'ASC'],
            ],
        });

        const blockCalibrationSetting = cmssettings_permissions_data.find(
            (item) => item.setting_name === "BLOCK_CALIBRATION_BEFORE_DUE"
        );

        const blockDays = blockCalibrationSetting
            ? Number(blockCalibrationSetting.setting_value)
            : 0;


        let masterResult = await masterResultTable.findOne({
            where: { lab_id, srf_id, srf_item_id },
        });

        let standard_details_Table = await standard_details_tableData(masterResult?.master_list_equipments)

        let expiredMasters = [];
        let blockedMasters = [];

        if (standard_details_Table?.length > 0) {
            standard_details_Table.forEach((master) => {

                if (!master.m_validity) return;
                const dateFormat = master.m_validity.includes("/")
                    ? "dd/MM/yyyy"
                    : "dd-MM-yyyy";

                const validityDate = parse(
                    master.m_validity,
                    dateFormat,
                    new Date()
                );

                const today = new Date();

                // Normalize time
                validityDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);

                // 🔴 EXPIRED CHECK
                if (isAfter(today, validityDate)) {
                    expiredMasters.push(`${master.m_identification_details}-${master.m_description} (Expired on: ${format(validityDate, "dd-MM-yyyy")})`);
                    return;
                }

                // 🟠 BLOCK BEFORE DUE CHECK
                if (blockDays > 0) {

                    const blockStartDate = subDays(validityDate, blockDays);

                    const isInBlockRange =
                        (isAfter(today, blockStartDate) || isEqual(today, blockStartDate)) &&
                        (isBefore(today, validityDate) || isEqual(today, validityDate));

                    if (isInBlockRange) {
                        blockedMasters.push(`${master.m_identification_details}-${master.m_description} (Expired on: ${format(validityDate, "dd-MM-yyyy")})`);
                    }
                }
            });
        }

        const isExpired = expiredMasters.length > 0;
        const isBlockedBeforeDue = blockedMasters.length > 0;

        const masterdeviceexpire = blockCalibrationSetting?.is_enable ? {
            isExpired,
            isBlockedBeforeDue,
            blockDays,
            expiredMasters,
            blockedMasters,
            // message: isExpired
            //     ? `Master expired: Please Recalibrate ${expiredMasters.join(", ")} then Update device Generate Certificate`
            //     : isBlockedBeforeDue
            //         ? `Calibration blocked ${blockDays} day(s) before validity date for: ${blockedMasters.join(", ")}`
            //         : null
            message: isExpired
                ? `Certificate issuance is prohibited. The validity of the following master instrument(s) has expired: ${expiredMasters.join(", ")}. Recalibration and validity update are mandatory prior to certificate generation.`
                : isBlockedBeforeDue
                    ? `Certificate issuance is restricted. The following master instrument(s) are within the restricted period of ${blockDays} day(s) prior to validity expiry: ${blockedMasters.join(", ")}. Recalibration is required before proceeding.`
                    : null
        } : [];


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
        const check_draft = certificate?.draftFileName ? true : false
        const iscalibration_done = calibration_done?.calibration_done_date ? true : false

        return res.json({ masterdeviceexpire, isGenerateCertificate: isGenerated, check, check_uncertainty, check_observation, check_draft, iscalibration_done });
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
            //m_identification_details: eachItem.asset_number,
            m_identification_details: eachItem.uid,
            m_certificate_filename: eachItem.mastercertificate_filename || '-',
            m_electro_parameter: eachItem.electro_parameter || '-',
            m_calibration_agency: eachItem.calibration_agency || '-'
        });
    });

    return result;
}



function capitalizeEachWord(params) {
    if (params === Number || params === null || params === undefined) return params
    return params
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function capitalizeFirstLetter(str) {
    if (typeof str !== 'string') return str;
    return str
        .toLowerCase()
        .split(' ')
        .filter(word => word.trim() !== '')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const cleanValue = (val) =>
    typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : val;

const applySymbol = (val, symbol, pos) => {
    if (!symbol || !val || val === '-') return val;
    return pos === 'Suffix' ? `${val}${symbol}` : `${symbol}${val}`;
};


const isValidNumber = (val) => {
    if (val === null || val === undefined) return false;

    const str = val.toString().trim();

    // Reject empty, dash, or non-numeric
    if (str === '' || str === '-') return false;

    // Allow integers & decimals (0, 0.001, 3.21, 10.000)
    return /^-?\d+(\.\d+)?$/.test(str);
};


// Is Ranges lc show single column 
function buildRangeLcTypeRow(range, lc, type, masterResult = {}, isEnabled) {
    console.log(range, "range");

    const keyValuePairs = [];

    /* -------------------------------
       RANGE + L.C (COMBINED)
    --------------------------------*/
    if (range || lc) {
        let combinedValue = "";

        if (range && lc) {
            combinedValue = `${range} / ${lc}`;
        } else if (range) {
            combinedValue = range;
        } else if (lc) {
            combinedValue = lc;
        }

        keyValuePairs.push({
            name: "RANGE / L.C:",
            value: combinedValue
        });
    }

    /* -------------------------------
       TYPE
    --------------------------------*/
    if (type) {
        keyValuePairs.push({
            name: "TYPE:",
            value: type
        });
    }

    /* -------------------------------
       WITNESSED BY
    --------------------------------*/
    if (
        isEnabled("WITNESSBY_PRINT_CERTIFICATE") &&
        Array.isArray(masterResult.witnessed_by) &&
        masterResult.witnessed_by.length > 0
    ) {
        const names = masterResult.witnessed_by
            .map(w => {
                if (w.name && w.designation) {
                    return `${capitalizeEachWord(w.name)} - (${capitalizeEachWord(w.designation)})`;
                } else if (w.name) {
                    return capitalizeEachWord(w.name);
                }
                return null;
            })
            .filter(Boolean)
            .join(", ");

        if (names) {
            keyValuePairs.push({
                name: "WITNESSED BY:",
                value: names
            });
        }
    }

    /* -------------------------------
       BUILD TABLE ROWS (2 PAIRS / ROW)
    --------------------------------*/
    const rows = [];
    for (let i = 0; i < keyValuePairs.length; i += 2) {
        const row = [];

        const first = keyValuePairs[i];
        row.push({ text: first.name });
        row.push({ text: first.value, alignment: "center" });

        if (keyValuePairs[i + 1]) {
            const second = keyValuePairs[i + 1];
            row.push({ text: second.name });
            row.push({ text: second.value, alignment: "center" });
        } else {
            row.push({}, {});
        }

        rows.push(row);
    }

    return rows;
}

const applyTableVAlignWorkaround = (tableRows) => {
    const rowHeightApprox = 15; // Approximate line height for fontSize 8-9
    tableRows.forEach(row => {
        if (Array.isArray(row)) {
            row.forEach(cell => {
                if (cell && typeof cell === 'object' && cell.rowSpan && cell.rowSpan > 1 && cell.vAlign) {
                    if (cell.vAlign === 'middle') {
                        const topMargin = ((cell.rowSpan - 1) * rowHeightApprox) / 2;
                        cell.margin = [0, topMargin, 0, 0];
                    } else if (cell.vAlign === 'bottom') {
                        const topMargin = (cell.rowSpan - 1) * rowHeightApprox;
                        cell.margin = [0, topMargin, 0, 0];
                    }
                }
            });
        }
    });
    return tableRows;
};


function formatDynamicRowsFromOriginalRanges(
    rangesArray,
    masterResult = [],
    isEnabled,
    type,
    description
) {
    if (!Array.isArray(rangesArray) || rangesArray.length === 0) return null;
    //console.log(rangesArray, "rangesArray");

    const isMeasuringPin = /measuring\s*pin/i.test(description || '');
    const isTaperMandrel = /TAPER\s*MANDREL/i.test(description || '');
    const isCoAxialGauge = /CO-AXIAL\s*GAUGE/i.test(description || '');
    const isConcentricityGauge = /CONCENTRICITY\s*GAUGE/i.test(description || '');
    let rangeMin = null;
    let rangeMax = null;
    let rangeValue = null;
    let lcValue = null;
    let uom = '';
    let symbol = '';
    let symbolPos = 'Prefix';

    let keyValuePairs = [];

    // -----------------------------
    // STEP 1: Extract RANGE / LC
    // -----------------------------
    for (const obj of rangesArray) {
        if (!obj || typeof obj !== 'object') continue;

        // Pick first valid UOM
        if (
            !uom &&
            obj.InstrumentparameterUOM &&
            obj.InstrumentparameterUOM.toString().toLowerCase() !== 'select'
        ) {
            uom = obj.InstrumentparameterUOM;
        }

        // Capture symbol info
        if (!symbol && obj.Symbols) {
            symbol = obj.Symbols;
            symbolPos = obj.SymbolPos || 'Prefix';
        }

        for (const [key, value] of Object.entries(obj)) {
            if (!value) continue;

            const normalizedKey = key.toLowerCase().replace(/\./g, '').trim();

            // ---------- RANGE ----------
            if (normalizedKey.includes('range')) {
                if (typeof value === 'string' && value.includes('-')) {
                    // Case: "0-300"
                    rangeValue = cleanValue(value);
                } else if (normalizedKey.includes('min')) {
                    rangeMin = cleanValue(value);
                } else if (normalizedKey.includes('max')) {
                    rangeMax = cleanValue(value);
                } else {
                    // Case: "01992"
                    rangeValue = cleanValue(value);
                }
            }

            // ---------- LC ----------
            if (
                normalizedKey === 'lc' ||
                normalizedKey === 'l c' ||
                normalizedKey.includes('leastcount')
            ) {
                lcValue = cleanValue(value);
            }
        }
    }

    // -----------------------------
    // STEP 2: Build Final RANGE
    // -----------------------------
    let finalRange = null;

    if (rangeMin !== null && rangeMax !== null) {
        finalRange = `${rangeMin}-${rangeMax}`;
    } else if (rangeValue) {
        finalRange = rangeValue;
    }

    const validLC = isValidNumber(lcValue) ? lcValue : null;

    if (rangeMin !== null && (isMeasuringPin || isTaperMandrel || isCoAxialGauge || isConcentricityGauge)) {
        keyValuePairs.push({
            name: 'RANGE MIN:',
            value: `${applySymbol(cleanValue(rangeMin), symbol, symbolPos)}${uom ? ' ' + uom : ''}`
        });
    }

    if (rangeMax !== null && (isMeasuringPin || isTaperMandrel || isCoAxialGauge || isConcentricityGauge)) {
        keyValuePairs.push({
            name: 'RANGE MAX:',
            value: `${applySymbol(cleanValue(rangeMax), symbol, symbolPos)}${uom ? ' ' + uom : ''}`
        });
    }

    if (lcValue !== null && (isMeasuringPin || isTaperMandrel || isCoAxialGauge || isConcentricityGauge)) {
        keyValuePairs.push({
            name: 'LC:',
            value: `${applySymbol(cleanValue(lcValue), symbol, symbolPos)}${uom ? ' ' + uom : ''}`
        });
    }



    if (
        (!isMeasuringPin && !isTaperMandrel && !isCoAxialGauge && !isConcentricityGauge) &&
        (finalRange || validLC)
    ) {
        let name = '';
        let display = '';

        if (finalRange && validLC) {
            name = 'RANGE / L.C:';
            display = `${applySymbol(finalRange, symbol, symbolPos)} / ${validLC}`;
        } else if (finalRange) {
            name = 'RANGE:';   // ✅ FIX
            display = applySymbol(finalRange, symbol, symbolPos);
        } else {
            name = 'L.C:';     // ✅ FIX
            display = validLC;
        }

        if (uom) display += ` ${uom}`;

        keyValuePairs.push({
            name,
            value: cleanValue(display)
        });
    }

    // -----------------------------
    // STEP 4: Other Keys
    // -----------------------------
    for (const obj of rangesArray) {
        const localUom =
            obj.InstrumentparameterUOM &&
                obj.InstrumentparameterUOM.toLowerCase() !== 'select'
                ? obj.InstrumentparameterUOM
                : '';

        // Each row can have its own symbol settings (e.g. GO vs NO-GO)
        const rowSymbol = obj.Symbols || '';
        const rowSymbolPos = obj.SymbolPos || 'Prefix';

        for (const [key, value] of Object.entries(obj)) {
            if (
                !value ||
                key === 'InstrumentUOMID' ||
                key === 'InstrumentparameterUOM' ||
                key === 'Symbols' ||
                key === 'SymbolPos'
            ) continue;

            const normalizedKey = key.toLowerCase().replace(/\./g, '').trim();

            // Skip Range & LC (already handled)
            if (
                normalizedKey.includes('range') ||
                normalizedKey === 'lc' ||
                normalizedKey.includes('leastcount')
            ) continue;

            // Apply symbol to all measurement values
            const displayValue = applySymbol(cleanValue(value), rowSymbol, rowSymbolPos);

            keyValuePairs.push({
                name: `${key.toUpperCase()}:`,
                value: `${displayValue}${cleanValue(localUom) ? ' ' + cleanValue(localUom) : ''}`
            });
        }
    }

    // -----------------------------
    // STEP 5: Witness
    // -----------------------------
    if (
        isEnabled("WITNESSBY_PRINT_CERTIFICATE") &&
        Array.isArray(masterResult) &&
        masterResult.length > 0
    ) {
        const witnessNames = masterResult
            .map(w =>
                w.name && w.designation
                    ? `${capitalizeEachWord(w.name)} - (${capitalizeEachWord(w.designation)})`
                    : w.name
                        ? capitalizeEachWord(w.name)
                        : null
            )
            .filter(Boolean)
            .join(', ');

        if (witnessNames) {
            keyValuePairs.push({
                name: 'WITNESSED BY:',
                value: capitalizeEachWord(witnessNames)
            });
        }
    }

    // -----------------------------
    // STEP 6: Instrument Type
    // -----------------------------
    if (type) {
        keyValuePairs.push({
            //name: 'INSTRUMENT TYPE:',
            name: 'INSTRUMENT / GAUGE SIZE:',
            value: cleanValue(type)
        });
    }

    if (keyValuePairs.length === 0) return null;

    // ✅ -----------------------------
    // ✅ SORT BEFORE BUILDING ROWS
    // -----------------------------
    const keyOrder = [];

    rangesArray.forEach(obj => {
        Object.keys(obj).forEach(k => {
            if (k === 'InstrumentUOMID' || k === 'InstrumentparameterUOM' || !obj[k]) return;

            const normalized = k.toUpperCase().replace(/\./g, '').trim();

            if (normalized.includes('RANGE') || normalized === 'LC' || normalized.includes('LEASTCOUNT')) {
                if (isMeasuringPin || isTaperMandrel || isCoAxialGauge || isConcentricityGauge) {
                    if (normalized.includes('MIN')) keyOrder.push('RANGE MIN:');
                    else if (normalized.includes('MAX')) keyOrder.push('RANGE MAX:');
                    else keyOrder.push('LC:');
                } else {
                    if (finalRange && validLC) keyOrder.push('RANGE / L.C:');
                    else if (finalRange) keyOrder.push('RANGE:');
                    else keyOrder.push('L.C:');
                }
            } else if (normalized.includes('SIZE')) {
                keyOrder.push('INSTRUMENT / GAUGE SIZE:');
            } else {
                keyOrder.push(`${k.toUpperCase()}:`);
            }
        });
    });

    // Add any manually added fields (like Witnessed By) to the end of the order list
    const uniqueKeyOrder = [...new Set([...keyOrder, ...keyValuePairs.map(i => i.name)])];

    keyValuePairs.sort((a, b) => {
        const aIndex = uniqueKeyOrder.indexOf(a.name);
        const bIndex = uniqueKeyOrder.indexOf(b.name);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    // -----------------------------
    // STEP 7: Build PDF Rows (2 columns)
    // -----------------------------
    let rows = [];
    const rangeItem = keyValuePairs.find(k => k.name.includes('RANGE'));
    const setNegItem = keyValuePairs.find(k => k.name.includes('SETVALUENEG'));
    const setPosItem = keyValuePairs.find(k => k.name.includes('SETVALUEPOS'));

    // ✅ SPECIAL CUSTOMER FORMAT
    if (rangeItem && setNegItem && setPosItem) {

        rows.push([
            {
                text: rangeItem.name,
                rowSpan: 2,
                vAlign: 'middle'   // ✅ vertical middle
            },
            {
                text: rangeItem.value,
                alignment: 'center', // horizontal center
                rowSpan: 2,
                vAlign: 'middle'     // ✅ vertical middle
            },
            { text: setNegItem.name },
            { text: setNegItem.value, alignment: 'center' }
        ]);

        rows.push([
            {}, // required empty cell for rowSpan
            {},
            { text: setPosItem.name },
            { text: setPosItem.value, alignment: 'center' }
        ]);

        keyValuePairs = keyValuePairs.filter(k =>
            !k.name.includes('RANGE') &&
            !k.name.includes('SETVALUENEG') &&
            !k.name.includes('SETVALUEPOS')
        );
    }

    for (let i = 0; i < keyValuePairs.length; i += 2) {
        const row = [];

        const first = keyValuePairs[i];
        row.push({ text: first.name });
        row.push({ text: first.value, alignment: 'center' });

        if (keyValuePairs[i + 1]) {
            const second = keyValuePairs[i + 1];
            row.push({ text: second.name });
            row.push({ text: second.value, alignment: 'center' });
        } else {
            row.push({ text: '' }, { text: '' });
        }

        rows.push(row);
    }
    //console.log(applyTableVAlignWorkaround(rows), "applyTableVAlignWorkaround(rows)");

    //return rows;
    return applyTableVAlignWorkaround(rows);
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


const previewCertificate = async (req, res, next) => {
    try {
        const { previewType, previewData, isNabl, cmeid } = req.body;


        const excelTable = await calibmasterexcel.findOne({
            where: {
                cmeid
            },
            attributes: ["diagram_image"],

        });

        const procedureimages = excelTable?.diagram_image || null;

        const imageContent = await generateImageContent(procedureimages);

        let excelData = previewData?.excelData || {};
        let mergedCells = previewData?.Mergedcell || {};
        let Styles = previewData?.Styles || {};
        let decimalPoint = previewData?.decimalPrecision || {};
        let selectedSheet_Cert = previewData?.selectedSheet_Cert;
        let selectedSheet_Obs = previewData?.selectedSheet_Obs;

        // ── Page margin settings from frontend ──
        // Certificate sheet uses its own saved settings
        const certSettings = await resolveSheetPageSettings(Styles, selectedSheet_Cert, previewData);

        // Observation sheet uses ITS OWN saved settings (independent of cert)
        const obsSettings = await resolveSheetPageSettings(Styles, selectedSheet_Obs, previewData);



        const ExcelProcedureTablelayout = {
            hLineWidth: (i, node) => (i === 0 ? 0.5 : 0.5),
            vLineWidth: () => 0.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 2, paddingRight: () => 2, paddingTop: () => 3, paddingBottom: () => 3
        };
        const observationTablelayout = {
            hLineWidth: (i, node) => (i === 0 ? 0.5 : 0.5),
            vLineWidth: () => 0.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 2, paddingRight: () => 2, paddingTop: () => 3, paddingBottom: () => 3
        };

        const ExcelProcedureTable = selectedSheet_Cert ? await generatePdfFromSheet(excelData, mergedCells, Styles, selectedSheet_Cert, decimalPoint, ExcelProcedureTablelayout, certSettings.fontSize, certSettings) : [];
        const observationTable = selectedSheet_Obs ? await generatePdfFromSheet(excelData, mergedCells, Styles, selectedSheet_Obs, decimalPoint, observationTablelayout, obsSettings.fontSize, obsSettings) : null;

        const item = {
            calibrationAt: 'Lab',
            intrument_type: {
                instrument: { instrument_name: 'Dummy Instrument', instrument_discipline_id: 1, instrument_group_id: 1 },
                range_minimum_uom: 'mm', range_maximum_uom: 'mm', least_count_uom: 'mm', size_spec_uom: 'mm', range_minimum: '0', least_count: '0.01', type: 'Standard'
            },
            srf: {
                dataValues: {
                    customer_dc: 'DC-DUMMY-001'
                },
                customer: { customer_name: 'Dummy Customer Pvt Ltd', address1: '123 Dummy Street', address2: 'Dummy Area', city: 'Dummy City', state: 'XY', pincode: '123456' },
                srf_number: 'SRF-DUMMY-123', customer_dc_date: new Date().toISOString()
            },
            make: 'Dummy Make', model: 'DM-1000', serial_no: 'SN-00001', identification_details: 'ID-00001',
            calibration_done_date: new Date().toISOString(), calibration_due_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            remarks: 'Received in good condition', dispatch_dc: 'DC-001', inward_no: 'INW-001', url_number: 'ULR-DUMMY-001'
        };

        const masterResult = {
            ulr_number: 'ULR-DUMMY-123456789', description: 'Calibration of Dummy Instrument', ref_std: 'IS 12345', calibration_procedure: 'WI/CAL/01',
            temperature: { mean: '20.0' }, humidity: { mean: '50.0' }, atmospheric_pressure: '1013', frequency: '50',
            remarks: ['The results given in Calibration Certificate are valid only to the particular instrument submitted for calibration under the above stated condition, certificate shall not be reproduced with out the written permission of the Laboratory.', 'Condition of the MI / Gauges as Received.:Found OK.'], witnessed_by: 'Self', master_list_equipments: [],
            calibrated_employee_master: { employee_full_name: 'John Doe', employee_role: 'Calibration Engineer', employee_signature: '' },
            approved_employee_master: { employee_full_name: 'Jane Doe', employee_role: 'Technical Manager', employee_signature: '' },
            authorizedby_employee_master: { employee_full_name: 'Authorized Signatory', employee_role: 'Quality Manager', employee_signature: '' }
        };

        const lab = {
            lab_name: 'Dummy Testing Laboratory', address1: '456 Tech Park', address2: 'Industrial Area', city: 'Demo City', state: 'Demo State', pincode: '987654',
            lab_website: 'www.dummylab.com', contact_email: 'info@dummylab.com', contact_number1: '123-456-7890',
            brand_logo_filename: undefined, seal_image_filename: undefined, nabl_logo_filename: undefined
        };

        const certificate_number = 'CERT-DUMMY-0001';
        const date_of_issue = Object.keys(format).length ? format(new Date(), "dd-MM-yyyy") : new Date().toLocaleDateString('en-GB');
        const cal_date = date_of_issue;
        const received_date = date_of_issue;
        const srf = item.srf.srf_number;
        const customer_name = item.srf.customer.customer_name;
        const customer_address = '123 Dummy Street, Dummy Area, Dummy City, XY - 123456.';
        const calibrationAt = item.calibrationAt;
        const disciplineName = 'Dummy Discipline';
        const groupName = 'Dummy Group';

        const description = item.intrument_type.instrument.instrument_name;
        const condition = item.remarks;
        const make = item.make;
        const model = item.model;
        const slNo = item.serial_no;
        const idNo = item.identification_details;

        const standard_details_Table = [
            {
                m_description: 'Dummy Calibrator', m_make: 'Dummy Brand', m_model: 'DM-100', m_serial_no: 'DC-001',
                m_certificate_no: 'CERT-001', m_validity: '31/12/2025', m_traceability: 'NABL', m_identification_details: 'ID-001'
            }
        ];

        let ebody = [];
        ebody.push([
            { text: 'ENVIRONMENTAL\nCONDITIONS', rowSpan: 2, alignment: 'center', bold: true, margin: [0, 5, 0, 5] },
            { text: 'TEMP', alignment: 'center', bold: true, margin: [0, 2, 0, 2] },
            { text: '20 ± 2°C', alignment: 'center', margin: [0, 2, 0, 2] },
            { text: 'RH', alignment: 'center', bold: true, margin: [0, 2, 0, 2] },
            { text: '50 ± 10%', alignment: 'center', margin: [0, 2, 0, 2] }
        ]);
        ebody.push([
            {},
            { text: 'ACTUAL', alignment: 'center', bold: true },
            { text: '20.0°C', alignment: 'center' },
            { text: 'ACTUAL', alignment: 'center', bold: true },
            { text: '50.0%', alignment: 'center' }
        ]);

        const thirdTableBody = [
            [
                { text: 'DESCRIPTION:' }, { text: description, alignment: 'center' },
                { text: 'DUC RECEIPT CONDITION:' }, { text: condition, alignment: 'center' }
            ],
            [
                { text: 'MAKE:' }, { text: make, alignment: 'center' },
                { text: 'MODEL:' }, { text: model, alignment: 'center' }
            ],
            [
                { text: 'SL.NO:' }, { text: slNo, alignment: 'center' },
                { text: 'ID.NO:' }, { text: idNo, alignment: 'center' }
            ],
            [
                { text: 'RANGE:' }, { text: item.intrument_type.range_minimum, colSpan: 1, alignment: 'center' },
                { text: 'LEAST COUNT:' }, { text: item.intrument_type.least_count, colSpan: 1, alignment: 'center' }
            ],
            [
                { text: 'CALIBRATION PROCEDURE :', alignment: 'left', bold: true },
                { colSpan: 3, alignment: 'left', stack: ['Calibration of Dummy Instrument As per IS 12345 As per WI/CAL/01'] }, {}, {}
            ]
        ];

        const isNABL = isNabl === true;
        const format_no_cert = isNABL ? "LAB/F/25/ Rev:07" : "LAB/F/26/ Rev:01";
        const format_no_obser = isNABL ? "LAB/F/25A/ Rev:04" : "LAB/F/26A/ Rev:01";
        const headerMargin = isNABL ? 93 : 88;

        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            // Fixed page margins — user's margin applies only to the Excel data block inside content
            pageMargins: [10, headerMargin, 10, 127],
            background: (currentPage, pageSize) => [
                {
                    canvas: [
                        { type: 'line', x1: 10, y1: 10, x2: 585, y2: 10, lineWidth: 2.5 },
                        { type: 'line', x1: 10, y1: 10, x2: 10, y2: 830, lineWidth: 2.5 },
                        { type: 'line', x1: 10, y1: 830, x2: 585, y2: 830, lineWidth: 2.5 },
                        { type: 'line', x1: 585, y1: 10, x2: 585, y2: 830, lineWidth: 2.5 }
                    ]
                }
            ],
            header: function (currentPage, pageCount) {
                if (isNABL) {
                    return [{
                        table: {
                            widths: [100, '*', 110],
                            body: [[
                                { text: 'NABL LOGO HERE', alignment: 'center', margin: [0, 25, 0, 25], border: [true, true, true, true] },
                                { text: "CALIBRATION CERTIFICATE", alignment: 'center', fontSize: 16, bold: true, margin: [0, 25, 0, 25], border: [true, true, true, true] },
                                { text: "COMPANY LOGO HERE\n" + lab.address1, alignment: 'center', margin: [0, 20, 0, 5], fontSize: 9, border: [true, true, true, true] }
                            ]]
                        },
                        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5 }, margin: [10, 10, 10, 0]
                    }];
                } else {
                    return [{
                        table: {
                            widths: ['*', 135.4],
                            body: [[
                                { text: "CALIBRATION CERTIFICATE", alignment: 'center', fontSize: 16, bold: true, margin: [80, 25, 0, 25], border: [false, true, false, true] },
                                { text: "COMPANY LOGO HERE\n" + lab.address1, alignment: 'center', margin: [0, 20, 0, 5], fontSize: 9, border: [true, true, false, true] }
                            ]]
                        },
                        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5 }, margin: [10, 10, 10, 0]
                    }];
                }
            },
            footer: function (currentPage, pageCount) {
                const signatureTable = {
                    table: {
                        widths: ['16.6%', '16.6%', '16.6%', '16.6%', '16.6%', '16.6%'],
                        body: [
                            [{ text: 'Calibrated By', alignment: 'center', fontSize: 8 }, { text: '', alignment: 'center' }, { text: 'Reviewd by', alignment: 'center', fontSize: 8 }, { text: '', alignment: 'center' }, { text: 'Authorized By', alignment: 'center', fontSize: 8 }, { text: '', alignment: 'center' }],
                            [{ text: 'Name', alignment: 'center', fontSize: 8 }, { text: 'John Doe', alignment: 'center', fontSize: 8 }, { text: 'Name', alignment: 'center', fontSize: 8 }, { text: 'Jane Doe', alignment: 'center', fontSize: 8 }, { text: 'Name', alignment: 'center', fontSize: 8 }, { text: 'Authorized Signatory', alignment: 'center', fontSize: 8 }]
                        ]
                    },
                    layout: { hLineWidth: (i, node) => (i === 0 ? 0.5 : (i === node.table.body.length ? 0.1 : 0.5)), vLineWidth: () => 0.3 }, margin: [10, 0, 8, 0]
                };
                const addressStack = { stack: [{ text: lab.lab_name, alignment: 'center', fontSize: 9, bold: true, margin: [20, 0, 0, 1] }, { text: lab.address2 + ' ' + lab.city + ' - ' + lab.pincode, alignment: 'center', fontSize: 8, margin: [20, 1, 0, 1] }, { text: 'Ph: ' + lab.contact_number1, alignment: 'center', fontSize: 8, margin: [20, 1, 0, 1] }, { text: 'E-mail id: ' + lab.contact_email, alignment: 'center', fontSize: 8, margin: [20, 1, 0, 0] }] };
                const qrCell = isNABL ? { text: 'QR LOGO', width: 50, alignment: 'center', margin: [0, 10, 0, 0] } : { text: '', width: 50 };
                const footerTable = {
                    table: { widths: isNABL ? ['*', 60] : ['*'], body: isNABL ? [[addressStack, qrCell]] : [[addressStack]] },
                    layout: { hLineWidth: () => 0.5, vLineWidth: (i) => (i === 1 ? 0 : 0.5), paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 5, paddingBottom: () => 5 }, margin: [10, 0, 10, 0]
                };
                const out = [signatureTable, footerTable];
                if (currentPage === pageCount) out.push({ table: { widths: ['*'], body: [[{ text: "***End of Certificate***", alignment: "center", fontSize: 9, bold: true }]] }, layout: 'noBorders', margin: [isNABL ? 0 : 40, 0, 26, 0] });
                out.push({ table: { widths: ['*', 'auto'], body: [[{ text: 'Page ' + String(currentPage).padStart(2, '0') + ' of ' + String(pageCount).padStart(2, '0'), alignment: "center", fontSize: 8 }, { text: format_no_cert, alignment: "right", fontSize: 8 }]] }, layout: 'noBorders', margin: [isNABL ? 60 : 95, 0, isNABL ? 20 : 13, 15] });
                return out;
            },
            content: [
                {
                    style: 'firstTable', table: {
                        widths: ['*', '*', '*', '*'],
                        body: [
                            [{ text: "CERTIFICATE NUMBER:", border: [true, false, true, true] }, { text: certificate_number, alignment: 'center', border: [true, false, true, true] }, { text: "DATE OF ISSUE:", border: [true, false, true, true] }, { text: date_of_issue, alignment: 'center', border: [true, false, true, true] }],
                            [{ text: "ULR NUMBER:" }, { text: item.url_number, alignment: 'center' }, { text: "RECEIVED DATE:" }, { text: received_date, alignment: 'center' }],
                            [{ text: [{ text: 'CUSTOMER NAME & ADDRESS:', bold: true }, '\n' + customer_name, '\n' + customer_address], rowSpan: 3, colSpan: 2, lineHeight: 1 }, {}, { text: "CAL.DATE:" }, { text: cal_date, alignment: 'center' }],
                            [{}, {}, { text: 'SRF.NO:' }, { text: srf, alignment: 'center' }],
                            [{}, {}, { text: 'SANSERA LAB ID NO:' }, { text: item.inward_no, alignment: 'center' }],
                            [{ text: 'Customer Reference No:' }, { text: item.dispatch_dc, alignment: 'center' }, { text: 'CALIBRATED AT:' }, { text: calibrationAt, alignment: 'center' }],
                            [{ text: "DISCIPLINE:" }, { text: disciplineName, alignment: "center" }, { text: "GROUP:" }, { text: groupName, alignment: "center" }]
                        ]
                    }, layout: { hLineWidth: (i, node) => (i === 0 ? 0.1 : 0.5), vLineWidth: () => 0.5 }
                },
                { style: 'secondTable', table: { widths: ['*'], body: [[{ text: 'DUC DETAILS', alignment: 'center', bold: true }]] }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: (i, node) => (i === node.table.body.length ? 'white' : 'white') } },
                { style: 'thirdTable', table: { widths: ['25%', '25%', '25%', '25%'], body: thirdTableBody }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: (i, node) => (i === node.table.body.length ? 'white' : 'black') } },
                { style: 'fivthTable', table: { widths: ['*'], body: [[{ text: 'STANDARD DETAILS', alignment: 'center', bold: true }]] }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: (i, node) => (i === node.table.body.length ? 'white' : 'black') } },
                {
                    style: 'sixthTable', table: {
                        widths: Array(8).fill('14.28%'),
                        body: [
                            [{ text: 'DESCRIPTION', alignment: 'center', bold: true }, { text: 'MAKE / MODEL', alignment: 'center', bold: true }, { text: 'Calibration Agency', alignment: 'center', bold: true }, { text: 'SL.NO / ID.NO', alignment: 'center', bold: true }, { text: 'VALIDITY', alignment: 'center', bold: true }, { text: 'CERTIFICATE.NO', alignment: 'center', bold: true }, { text: 'TRACEABILITY', alignment: 'center', bold: true }],
                            ...standard_details_Table.map(s => [{ text: s.m_description + ' - ' + s.m_identification_details, alignment: 'center' }, { text: s.m_make + ' / ' + s.m_model, alignment: 'center' }, { text: '-', alignment: 'center' }, { text: s.m_serial_no + ' / ' + s.m_identification_details, alignment: 'center' }, { text: s.m_validity, alignment: 'center' }, { text: s.m_certificate_no, alignment: 'center' }, { text: s.m_traceability, alignment: 'center' }])
                        ]
                    }, layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: (i, node) => (i === node.table.body.length ? 'white' : 'black') }
                },
                { style: "thirdTable", table: { widths: Array(5).fill("*"), body: ebody }, margin: [0, 0, 0, 0], layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5 } },
                ...Array.isArray(imageContent) ? imageContent : [],
                // ── Excel data block: user-defined margins apply ONLY to this section ──
                ...(
                    Array.isArray(ExcelProcedureTable) && ExcelProcedureTable.length > 0
                        ? [{
                            stack: ExcelProcedureTable,
                            margin: [certSettings.marginLeft, certSettings.marginTop, certSettings.marginRight, certSettings.marginBottom]
                        }]
                        : []
                ),
                { stack: [{ text: 'REMARKS:', bold: true, decoration: 'underline', margin: [3, 1, 0, 1] }, { style: 'remarksList', ol: masterResult.remarks, lineHeight: 1.5, margin: [3, 0, 1.3, 0] }], id: 'remark_part' }
            ],
            defaultStyle: { columnGap: 0, font: 'Calibri', fontSize: 8.5 }
        };

        const chunks = [];
        let combinedPdfDoc = null;

        if (previewType === 'observation' || previewType === 'both') {
            const observationBuffer = await generateObservationReport(
                fs,
                path,
                printer,
                observationTable,
                observationTablelayout,
                item,
                masterResult,
                lab,
                certificate_number,
                'John Doe',
                'Jane Doe',
                'Authorized Signatory',
                [],
                standard_details_Table,
                { issue_date: new Date() },
                format_no_obser,
                imageToBuffer,
                obsSettings,
                true // isPreview
            );

            if (previewType === 'observation') {
                res.set({ "Content-Type": "application/pdf" });
                return res.send(observationBuffer);
            } else if (previewType === 'both') {
                // Return Certificate if they selected "both". Combining requires pdf-lib which isn't imported cleanly here yet,
                // The user's earlier requirement implies they want to see the exact layouts.
                // Normally pdfmake doesn't let you embed another pdfmake buffer nicely. 
                // Wait, if both is passed, pdfmake cannot combine two completely different doc definitions (margins, headers etc are top level).
                // Let's use pdf-lib to merge them, if it's available.
                try {
                    const { PDFDocument } = require('pdf-lib');

                    const certBuffer = await new Promise((resolve) => {
                        const certPdf = printer.createPdfKitDocument(docDefinition);
                        const cChunks = [];
                        certPdf.on("data", c => cChunks.push(c));
                        certPdf.on("end", () => resolve(Buffer.concat(cChunks)));
                        certPdf.end();
                    });

                    const pdfDocCombined = await PDFDocument.create();

                    // Add Cert pages
                    const certDoc = await PDFDocument.load(certBuffer);
                    const certPages = await pdfDocCombined.copyPages(certDoc, certDoc.getPageIndices());
                    certPages.forEach(page => pdfDocCombined.addPage(page));

                    // Add Obs pages
                    const obsDoc = await PDFDocument.load(observationBuffer);
                    const obsPages = await pdfDocCombined.copyPages(obsDoc, obsDoc.getPageIndices());
                    obsPages.forEach(page => pdfDocCombined.addPage(page));

                    const finalPdfBytes = await pdfDocCombined.save();
                    res.set({ "Content-Type": "application/pdf" });
                    return res.send(Buffer.from(finalPdfBytes));

                } catch (pdfLibError) {
                    console.error("PDF-LIB Merge Error:", pdfLibError);
                    // Fallback to sending just the Certificate if merging fails
                    combinedPdfDoc = printer.createPdfKitDocument(docDefinition);
                }
            }
        } else {
            combinedPdfDoc = printer.createPdfKitDocument(docDefinition);
        }

        if (combinedPdfDoc) {
            combinedPdfDoc.on("data", chunk => chunks.push(chunk));
            combinedPdfDoc.on("end", () => {
                const buffer = Buffer.concat(chunks);
                res.set({ "Content-Type": "application/pdf" });
                return res.send(buffer);
            });
            combinedPdfDoc.end();
        }

    } catch (err) {
        console.log("previewCertificate error:", err);
        return res.status(500).json({ message: "Certificate Create Error" });
    }
}


const MM_TO_PT = 2.8346;

function resolveSheetPageSettings(Styles, sheetName, previewData) {
    try {
        const sheetStyle = Styles?.[sheetName] || {};

        const userMargin = previewData?.pageMargin || sheetStyle.pageMargin || {};
        const marginLeft = Math.round((userMargin.left ?? 0) * MM_TO_PT);
        const marginRight = Math.round((userMargin.right ?? 0) * MM_TO_PT);
        const marginTop = Math.round((userMargin.top ?? 0) * MM_TO_PT);
        const marginBottom = Math.round((userMargin.bottom ?? 0) * MM_TO_PT);

        const orientation = previewData?.pageOrientation || sheetStyle.pageOrientation || 'portrait';
        const fontSize = previewData?.printFontSize || sheetStyle.printFontSize || 8;

        return { marginLeft, marginRight, marginTop, marginBottom, orientation, fontSize };
    } catch (error) {
        console.log(error);

    }

}
exports.generate = generate;
exports.download = download;
exports.verify_certificate = verify_certificate;
exports.standard_details = standard_details;
exports.bulkDownload_Certificate = bulkDownload_Certificate;
exports.previewCertificate = previewCertificate;