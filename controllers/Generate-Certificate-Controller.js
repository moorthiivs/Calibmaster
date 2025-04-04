// *** Import Dev Packages ***
var pdfMake = require("pdfmake/build/pdfmake");
var pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake || {};

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
const MasterListEquipment = require("../models").MasterListEquipment;
const Certificate = require("../models").Certificate;

// *** Result Table Models ***
const masterResultTable = require("../models").master_result_table;
const resultTable = require("../models").result_table;


const { ProcedureResult } = require('../models');

const { generatePdfFromSheet, generatePdfTables } = require('../utils/pdfUtils');

const calibmasterexcel = require('../models').CalibmasterExcel


ProcedureResult.belongsTo(calibmasterexcel, {
    foreignKey: 'master_design_procedure_id',
    targetKey: 'master_design_procedure_id'
})

// Error Handler 
const { errorHandler } = require("../helpers/error-handler");
const { generateImageContent } = require("../utils/ProcedureImage");

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

const footerLongText = "The Calibration Certificate is valid only for the condition of the received DUC at the time under the stated condition of calibration. The calibration certificate shall not be reproduced in full without written approval of Lab Head. DUC: Device Under Calibration. Calibration Measurement are traceable to SI Units through unbroken chain of calibration from competent laboratory.";

const generate = async (req, res, next) => {

    try {

        const { lab_id, srf_id, srf_item_id, customer_info } = req.body;

        const skip_response = req.body?.skip_response || false;

        //const certificate_number = new Date().getTime();

        let ExcelProcedureTable;
    

          const excelTable = await ProcedureResult.findOne({
            where: {
              labid: lab_id,
              srf_id,
              srf_item_id
            },
            attributes: ["ExcelData", "print_on_certificate"],
            include: [{
                model: calibmasterexcel,
                as: 'CalibmasterExcel', 
                attributes: ['diagram_image'], 
                required: false, 
              }]
          });
          

          const procedureimages = excelTable.CalibmasterExcel ? excelTable.CalibmasterExcel.diagram_image : null;

          const imageContent = await generateImageContent(procedureimages);
          
          //Extract the ExcelData object
          const excelData = excelTable.dataValues.ExcelData;

          const selectedSheet = excelTable.dataValues.print_on_certificate;
          
          //Pass the extracted ExcelData to the function
          const pdfBuffer = await generatePdfFromSheet(excelData,selectedSheet,imageContent);

          ExcelProcedureTable = pdfBuffer

          const excelProcedureTables = await generatePdfTables(excelData, selectedSheet);

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


        const itemCount = await Item.count({
            where: {
              srf_id: srf_id,
              rstatus: 1
            }
        });
          

        // return res.json({ item });

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
        const slNo = item?.serial_no;
        const idNo = item?.identification_details;
        const range = `${item?.intrument_type?.range_minimum ?? ''} - ${item?.intrument_type?.range_maximum ?? ''} ${item?.intrument_type?.range_maximum_uom?.uom_printsysmbol ?? ''}`
        const lc = `${item?.intrument_type?.least_count  ?? ''} ${item?.intrument_type?.least_count_uom?.uom_printsysmbol  ?? ''}`;
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
        const temperature = masterResult?.temperature;
        const humidity = masterResult?.humidity;
        const remarks = masterResult?.remarks;

        // *** Create Format for Master list Equipments ***
        let masterListEquipment = await standard_details(masterResult?.master_list_equipments);


        const { m_description, m_make, m_serial_no, m_certificate_no, m_validity, m_traceability, m_identification_details, m_certificate_filename,master_quantity } = masterListEquipment;
        // return res.json(masterListEquipment);
        
        const srf = item.srf.dataValues.srf_number;
        
        const certificate_number = `SSPI/${new Date().getFullYear().toString().slice(-2)}/${srf}/${itemCount}`;

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
        // return res.json(lab);

        // *** Find Results ***
        // const tableDesignArr = await resultTable.findAll({
        //     where: {
        //         master_result_table_id: masterResult?.master_result_table_id,
        //         print_on_certifcate: 'YES'
        //     },
        //     order: [
        //         ['fromId', 'ASC'],
        //     ],
        // });
        // // return res.json(tableDesignArr);

        // const bigEyeObj = [];

        // for (let x = 0; x < tableDesignArr.length; x++) {

        //     const Columns = tableDesignArr[x].columns;
        //     const table_type = tableDesignArr[x].table_type;

        //     const FirstHeaderTexts = tableDesignArr[x].header_texts;
        //     const secondHeaderTexts = tableDesignArr[x].second_row_headers;

        //     const headerTypes = tableDesignArr[x].header_types;
        //     const cellTexts = tableDesignArr[x].cell_texts;
        //     const procedureimages = tableDesignArr[x].procedure_image_filename;
        //     const conditional_formats = tableDesignArr[x].conditional_formats

        //     // const widthsArr = [];

        //     // const eachTableContainer = [];

        //     // for (let i = 0; i < cellTexts?.length; i++) {
        //     //     let eachRow = [];
        //     //     for (const key in cellTexts[i]) {
        //     //         eachRow.push({ text: cellTexts[i][key]?.val });
        //     //     }
        //     //     eachTableContainer.push(eachRow)
        //     // }

        //     // for (let i = 0; i < Columns; i++) {
        //     //     if (Columns <= 10) {
        //     //         widthsArr.push(100);
        //     //     } else {
        //     //         widthsArr.push(60);
        //     //     }
        //     // }

        //     // const eachObj = {
        //     //     style: 'eachTableStyle',
        //     //     color: '#444',
        //     //     table: {
        //     //         widths: widthsArr,
        //     //         headerRows: 2,
        //     //         keepWithHeaderRows: 1,
        //     //         body: eachTableContainer
        //     //     }
        //     // }
        //     // bigEyeObj.push(eachObj);

        //     // added newly
        //     if (procedureimages.length) {
        //         const imageBuffers = await Promise.all(procedureimages.map(async (image) => {
        //             const imagePath = path.resolve(__dirname, `../public/procedure_images/${image}`);
        //             return imageToBuffer(imagePath);
        //         }));

        //         const validImageBuffers = imageBuffers.filter(buffer => buffer !== false);

        //         const content = validImageBuffers.length === 1 ? {
        //             alignment: 'center',
        //             image: validImageBuffers[0],
        //             fit: [150, 100],
        //             margin: [0, 20, 0, 20]
        //         } : {
        //             columns: validImageBuffers.map((imageData) => ({
        //                 image: imageData,
        //                 fit: [150, 100],
        //                 alignment: 'center'
        //             })),
        //             columnGap: 10,
        //             alignment: 'center',
        //             margin: [0, 20, 0, 20]
        //         };

        //         bigEyeObj.push(content);
        //     }
        //     const eachTableContainer = [];
        //     let eachTableHeader = 1;

        //     for (let i = 0; i < cellTexts?.length; i++) {
        //         let eachRow = [];
        //         for (const key in cellTexts[i]) {
        //             let { val, constFormula } = cellTexts[i][key];

        //             if (conditional_formats[key]) {
        //                 let v = isNaN(Number(val)) ? 0 : Number(val);
        //                 if (!(conditional_formats[key].higher_range >= v && conditional_formats[key].lower_range <= v)) {
        //                     if (conditional_formats[key].higher_range < v)
        //                         val = conditional_formats[key].higher_range;
        //                     else if (conditional_formats[key].lower_range > v)
        //                         val = conditional_formats[key].lower_range;
        //                 }
        //             }

        //             const textContent = constFormula.split(/[\(\)]/);
        //             if (textContent[0].trim() === 'HEADER')
        //                 eachRow.push({ text: val, bold: true });
        //             else
        //                 eachRow.push({ text: val === '--' ? '' : val });
        //             if (i === 0 && !(textContent[0].trim() === 'BLANK' || textContent[0].trim() === 'HEADER')) {
        //                 eachTableHeader = 0;
        //             }
        //         }
        //         eachTableContainer.push(eachRow)
        //     }

        //     let eachTable = []
        //     let startingIndex = 0;
        //     let endingIndex = 8;

        //     for (let i = 1; i <= Math.ceil(Columns / 8); i++) {  // Overflow the table columns are split 8 columns
        //         endingIndex *= i;
        //         let eachRow = []
        //         eachTableContainer.map((row) => {
        //             eachRow.push(row.slice(startingIndex, endingIndex));
        //         })
        //         startingIndex += 8;
        //         eachTable.push(eachRow)
        //     }
        //     eachTable.map((tableItem) => {

        //         let widthsArr = []
        //         for (let i = 0; i < tableItem[0].length; i++) {
        //             widthsArr.push(60);
        //         }

        //         const eachObj = {
        //             style: 'eachTableStyle',
        //             table: {
        //                 widths: widthsArr,
        //                 headerRows: eachTableHeader,
        //                 keepWithHeaderRows: eachTableHeader,
        //                 body: tableItem
        //             }
        //         }
        //         bigEyeObj.push(eachObj);
        //     })
        //     // bigEyeObj.push(cellTexts);
        // }
        // return res.json(bigEyeObj);

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

        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [20, 130, 20, 70],
            background: [                     
                {
                    image: labLogo_1_Buffer,
                    width: 200,
                    height: 300,
                    opacity: 0.1,
                    alignment: 'center',
                    angle: 45,
                    margin: [0, 150]
                }
            ],
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
                                    fontSize: 30,
                                    bold: true,
                                    margin: [0, 20, 0, 0],
                                    color:"#282B3E"
                                },
                                {
                                    text: lab_address,
                                    alignment: 'center',
                                    fontSize: 10,
                                    margin: [0,3, 0, 0],
                                    lineHeight: 1.1,
                                    color:"#282B3E",
                                    bold: true,
                                },
                                // {
                                //     text: `Mobile: ${lab.contact_number1}${lab.contact_number2 ? ` | ${lab.contact_number2}` : ''} / Website: ${lab.lab_website}`,
                                //     alignment: 'center',
                                //     fontSize: 9,
                                //     margin: [0, 2, 0, 0],
                                //     lineHeight: 1.1
                                // },
                                {
                                    text: `Mobile: ${lab.contact_number1}${lab.contact_number2 ? ` / ${lab.contact_number2}` : ''} | Email: ${lab.contact_email}`,
                                    alignment: 'center',
                                    fontSize: 10,
                                    margin: [0, 3, 0, 0],
                                    lineHeight: 1.1,
                                    color:"#282B3E",
                                    bold: true,
                                },
                                // {
                                //     text: `Email: ${lab.contact_email}`,
                                //     alignment: 'center',
                                //     fontSize: 9,
                                //     margin: [0, 5, 0, 0],
                                //     lineHeight: 1.1
                                // },
                                // {
                                //     text: 'CERTIFICATE OF CALIBRATION',
                                //     alignment: 'center',
                                //     fontSize: 16,
                                //     bold: true,
                                //     margin: [0, 5, 0, 0],
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
                        margin: [0, 0, 0, 50]
                    },
                ];
            },            

            footer: function(currentPage, pageCount) {
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
                            // {
                            //     id: 'signature_part',
                            //     alignment: 'justify',
                            //     columns: [
                            //         {
                            //             ul: [
                            //                 {
                            //                     image: sign1LogoBuffer,
                            //                     width: 30,
                            //                     margin: [0, 0, 0, 0],
                            //                     alignment: 'center'
                            //                 },
                            //                 { 
                            //                     text: `${calibrated_employee_name}`, 
                            //                     listType: 'none', 
                            //                     fontSize: 8 
                            //                 },
                            //                 { 
                            //                     text: `${calibrated_employee_role}`, 
                            //                     listType: 'none', 
                            //                     fontSize: 8 
                            //                 },
                            //                 { 
                            //                     text: 'Calibrated By', 
                            //                     listType: 'none', 
                            //                     fontSize: 8 
                            //                 }
                            //             ],
                            //             alignment: 'center'
                            //         },
                            //         sealBuffer ? { 
                            //             image: sealBuffer, 
                            //             width: 40, 
                            //             margin: [0, 0, 0, 0], 
                            //             alignment: 'center' 
                            //         } : { text: '' },
                            //         {
                            //             ul: [
                            //                 {
                            //                     image: sign2LogoBuffer,
                            //                     width: 30,
                            //                     margin: [0, 0, 0, 0],
                            //                     alignment: 'center'
                            //                 },
                            //                 { 
                            //                     text: `${approved_employee_name}`, 
                            //                     listType: 'none', 
                            //                     fontSize: 8 
                            //                 },
                            //                 { 
                            //                     text: `${approved_employee_role}`, 
                            //                     listType: 'none', 
                            //                     fontSize: 8 
                            //                 },
                            //                 { 
                            //                     text: 'Approved by', 
                            //                     listType: 'none', 
                            //                     fontSize: 8 
                            //                 }
                            //             ],
                            //             alignment: 'center'
                            //         },
                            //     ],
                            //     margin: [0, -40, 0, 5],
                            // },
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
                    //bold: true,
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
                                { text: "DUE.DATE:" },
                                { text: due_date || '-', alignment: 'center' }
                            ],
                            [
                                {},
                                {},
                                { text: 'CONDITION:' },
                                { text: condition || '-', alignment: 'center' }
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
                        widths: ['*', '*'],
                        body: [
                            [
                                { text: 'DUC DETAILS', alignment: 'center', decoration: 'underline' },
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
                    style: 'thirdTable',
                    table: {
                        widths: ['25%', '25%', '25%', '25%'],
                        body: [
                            [
                                { text: 'DESCRIPTION:' },
                                { text: description || '-', alignment: 'center', },
                                { text: 'DESCRIPTION:' },
                                { text: masterDescription || '-', alignment: 'center', },
                            ],
                            [
                                { text: 'MAKE:' },
                                { text: make || '-', alignment: 'center', },
                                { text: 'MAKE:' },
                                { text: masterMake || '-', alignment: 'center', },
                            ],
                            [
                                { text: 'SL.NO:' },
                                { text: slNo || '-', alignment: 'center', },
                                { text: 'SL.NO:' },
                                { text: masterSlNo || '-', alignment: 'center', },
                            ],
                            [
                                { text: 'ID.NO:' },
                                { text: idNo || '-', alignment: 'center', },
                                { text: 'ID.NO:' },
                                { text: masterId_no || '-', alignment: 'center', },
                            ],
                            [
                                { text: 'RANGE:' },
                                { text: range || '-', alignment: 'center', },
                                { text: 'VALIDITY:' },
                                { text: masterValidity || '-', alignment: 'center', },
                            ],
                            [
                                { text: 'L.C:' },
                                { text: lc || '-', alignment: 'center', },
                                { text: 'CERTIFICATE.NO:' },
                                { text: masterCertificateNo || '-', alignment: 'center', },
                            ],
                            [
                                { text: 'TYPE:' },
                                { text: type || '-', alignment: 'center', },
                                { text: 'TRACEABILITY:' },
                                { text: masterTraceability || '-', alignment: 'center', },
                            ],
                        ]
                    }
                }, 
                {
                    style: 'fourthTable',
                    table: {
                        widths: ['*', '*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: "CALIBRATION PROCEDURE & REF.STD:" },
                                { text: `${calibration_procedure || '-'} & ${ref_std || '-'}`, alignment: 'center', }
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
                    style: 'fivthTable',
                    table: {
                        widths: ['*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: 'ENVIRONMENTAL CONDITION:', decoration: 'underline',  fontSize: 8, }
                            ]
                        ]
                    }
                },
                {
                    style: 'sixthTable',
                    table: {
                        widths: ['*', '*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: 'TEMPERATURE (°C):' },
                                { text: temperature, }
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
                    style: 'seventhTable',
                    table: {
                        widths: ['*', '*'],
                        headerRows: 1,
                        body: [
                            [
                                { text: 'HUMIDITY (RH %):' },
                                { text: humidity, }
                            ]
                        ]
                    } 
                },
                {
                    style: 'eightthTable',
                    margin: [0, 5, 0, 5],
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [
                                { text: 'CALIBRATION RESULT', decoration: 'underline',
                                    fontSize: 8, alignment: 'center',
                                    bold: true },
                                { text: '( All Values are in mm ) :',fontSize: 8, alignment: 'center', bold: true }
                            ]
                        ]
                    },
                    layout: 'noBorders'
                },
                //bigEyeObj,

                ...imageContent,
                ...excelProcedureTables,

                // {
                //     style: 'ninethTable',
                //     margin: [0, 0, 0, 0],
                //     table: {
                //         headerRows: 1,
                //         widths: Array(ExcelProcedureTable[0].length).fill('*'),
                //         body: ExcelProcedureTable
                //       },
                //       layout: {
                //         fillColor: rowIndex => (rowIndex === 0 ? '#CCCCCC' : null),
                //         hLineColor: () => '#AAA',
                //         vLineColor: () => '#AAA'
                //       } 
                // },
                // {
                //     id:"remark_part",
                //     text: 'REMARKS', style: 'subheader',decoration: 'underline', 
                //     margin: [0 ,20, 0, 5]
                // },
                // {
                //     style: 'remarksList',
                //     ol: remarks ,
                //     lineHeight: 1.1 
                // },

                {
                    id: 'remark_part',
                    stack: [
                        { text: 'REMARKS:', decoration: 'underline', margin: [0, 10, 0, 5], pageBreakIfLessThan: 150  },
                        {
                            style: 'remarksList',
                            ol: remarks
                        }
                    ]
                },
                {
                    id: 'signature_part',
                    alignment: 'justify',
                    columns: [
                        {
                            ul: [
                                {
                                    image: sign1LogoBuffer,
                                    width: 60,
                                    margin: [0, 0, 0, 0],
                                    alignment: 'center'
                                },
                                { text: `${calibrated_employee_name}`, listType: 'none', fontSize: 8 },
                                { text: `${calibrated_employee_role}`, listType: 'none', fontSize: 8 },
                                { text: 'Calibrated By', listType: 'none',fontSize: 8,bold: true }
                            ],
                            alignment: 'center'
                        },
                        sealBuffer ? { image: sealBuffer, width: 60, margin: [0, 0, 0, 0], alignment: 'center' } : { text: '' },
                        {
                            ul: [
                                {
                                    image: sign2LogoBuffer,
                                    width: 60,
                                    margin: [0, 0, 0, 0],
                                    alignment: 'center'
                                },
                                { text: `${approved_employee_name}`, listType: 'none',    fontSize: 8 },
                                { text: `${approved_employee_role}`, listType: 'none',    fontSize: 8 },
                                { text: 'Approved by', listType: 'none',fontSize: 8, bold: true }
                            ],
                            alignment: 'center'
                        },
                    ],
                    margin: [0, 10, 0, 5],
                },
            ],
            pageBreakBefore: function (currentNode) {
                //return false
                if (currentNode.id === 'signature_part' && currentNode.pageNumbers.length != 1)
                    return true;
                if (currentNode.id === 'remark_part' && currentNode.pageNumbers.length != 1)
                    return true;
                return currentNode.style && currentNode.style.indexOf('pdf-pagebreak-before') > -1;
            },
            defaultStyle: {
                columnGap: 20,
            },

            // pageBreakBefore: function(currentNode) {
            //     // Force signature to stay with footer content
            //     if (currentNode.id === 'signature_part') {
            //       const remainingSpace = 792 - currentNode.y - 150; 
            //       if (remainingSpace < 200) {
            //         return true;
            //       }
            //     }
      
            //     if (currentNode.id === 'remark_part' && imageContent.length > 0 && excelProcedureTables.length > 0) {
                    
            //         return true;
            //     }
            //         return false;
            
            // },
          

              defaultStyle: { columnGap: 0 },

              styles: {
                  firstTable:{
                      fontSize: 8
                  },
                  secondTable:{
                      fontSize: 8
                  },
                  thirdTable:{
                      fontSize: 8
                  },
                  fourthTable:{
                      fontSize: 8
                  },
                  sixthTable:{
                      fontSize: 8
                  },
                  seventhTable:{
                      fontSize: 8
                  },
                  ninethTable:{
                      fontSize: 6
                  },
                  remarks_style:{
                      fontSize: 8
                  },
                  remarksList:{
                      fontSize: 8
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
                //   eachTableStyle: {
                //       margin: [0, 10, 0, 10],
                //       fontSize: 9
                //   },
                  // remarksList: {
                  //     margin: [10, 0, 0, 0],
                  // }
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

            await Item.update({
                certificate_date: new Date().toLocaleDateString("en-IN").split('/').reverse().join('-')
                , certificate_no: certificate_number
            }, {
                where: { srf_item_id }
            });
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
            const masterURL = path.join(__dirname, '../master_certificates', m_certificate_filename);

            const { msg, status } = await sendMail(srfItemsQuery, pdfURL);
            // console.log({ msg, status });

            // push generated certificate to customer portal
            Customerportalcertificate(pdfURL, fileName, masterURL, m_certificate_filename, customer_info);

            if (skip_response) return;

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
        return skip_response || errorHandler(error, req, res, next);
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

const verify_certificate = async (req, res, next) => {

    try {
        const { srf_item_id } = req.body;

        // ***  Query Certificate by srf_item_id ***
        let certificate = await Certificate.findOne({
            where: { srfitemId: srf_item_id },
            order: [['createdAt', 'DESC']]
        });

        const check = certificate?.fileName ? true : false;

        return res.json({ check });
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

    return { m_description, m_make, m_serial_no, m_certificate_no, m_validity, m_traceability, m_identification_details, m_certificate_filename,master_quantity };
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