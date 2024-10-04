var pdfMake = require("pdfmake/build/pdfmake");
var pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake.vfs;
var fs = require("fs");
const path = require('path');
const imageDataURI = require('image-data-uri');
const nodemailer = require("nodemailer");

const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const Lab = require("../models").Lab;
const customer = require("../models").customer;
const instrument_type = require("../models").instrument_type;

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

const create = async (req, res, next) => {

    const {
        srf_id, srf_item_id, lab_id,
        returnAfterCalibration, sendForRepairs, notForSale, sendForCalibration, returnableMaterial
    } = req.body;

    if (!srf_id || !srf_item_id || !lab_id) {
        let action = "All fields are required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let existingLab, srf, items;

    try {
        srf = await SRF.findOne({
            where: {
                srf_id,
                rstatus: 1,
            },
            include: [
                {
                    model: Lab,
                    as: "lab",
                    attributes: {
                        exclude: [
                            "brand_logo", "other_logo1_image", "other_logo2_image",
                            "created_timestamp", "created_by_login_name", "created_by_user_id",
                            "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
                        ]
                    }
                },
                {
                    model: customer,
                    as: "customer",
                    attributes: {
                        exclude: [
                            "created_timestamp", "created_by_login_name", "created_by_user_id",
                            "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
                        ]
                    }
                }
            ]
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Error on getting srf_id");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        items = await Item.findAll({
            where: {
                srf_item_id,
                rstatus: 1,
            },
            include: [
                {
                    model: instrument_type,
                    as: "intrument_type",
                    attributes: {
                        exclude: [
                            "created_timestamp", "created_by_login_name", "created_by_user_id",
                            "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
                        ]
                    },
                },
            ],
            attributes: {
                exclude: [
                    "created_timestamp", "created_by_login_name", "created_by_user_id",
                    "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
                ],
            },
            order: [["srf_item_id", "ASC"]],
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Error on getting child srf_items");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        existingLab = await Lab.findOne({
            where: { lab_id: lab_id, rstatus: 1 },
            attributes: {
                exclude: [
                    "brand_logo", "other_logo1_image", "other_logo2_image",
                    "created_timestamp", "created_by_login_name", "created_by_user_id",
                    "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
                ]
            }
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Failed to find existingLab");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    const labLogoPath = path.resolve(__dirname, `../public/images/${existingLab.brand_logo_filename}`);
    const labLogoBuffer = await imageToBuffer(labLogoPath);

    const checkedLogoPath = path.resolve(__dirname, '../public/logos/checked.jpg');
    const checkedLogoBuffer = await imageToBuffer(checkedLogoPath);

    const unCheckedLogoPath = path.resolve(__dirname, '../public/logos/unchecked.jpg');
    const unCheckedLogoBuffer = await imageToBuffer(unCheckedLogoPath);

    let itemsArray = [
        [
            { text: 'Sl No', alignment: 'center' },
            { text: 'Description of Delivery Items', alignment: 'center' },
            { text: 'Qty', alignment: 'center' },
            { text: 'Make/Model', alignment: 'center' },
            { text: 'Serial No', alignment: 'center' },
            { text: 'ID No', alignment: 'center' },
            { text: 'Remarks', alignment: 'center' }
        ],
    ];

    for (let i = 0; i < items?.length; i++) {
        const keys = [
            `${i + 1}`,
            `${items[i]['intrument_type']?.instrument_full_name}`,
            `${items[i]['srf_item_no']}`,
            `${items[i]['make']}`,
            `${items[i]['serial_no']}`,
            `${items[i]['identification_details']}`,
            `${items[i]['remarks']}`
        ];
        itemsArray.push(keys);
    }

    let issue_date = (srf?.issue_date) ? srf?.issue_date : "--";
    let amend_date = (srf?.amend_date) ? srf?.amend_date : "--";

    var docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 40, 40, 30],
        header: {
            text: 'Delivery Challan', alignment: 'center', margin: [0, 10, 0, 0], decoration: 'underline'
        },
        footer: function (currentPage, pageCount) {
            return {
                text: currentPage.toString() + ' of ' + pageCount, alignment: 'center', fontSize: 10
            }
        },
        content: [
            {
                columns: [
                    [
                        { text: `${existingLab.address1}`, width: 100 },
                        { text: `${existingLab.address2}`, width: 100 },
                        existingLab.address3 && { text: `${existingLab.address3}`, width: 100 },
                        { text: `${existingLab.city}, ${existingLab.state} - ${existingLab.pincode}`, width: 100 },
                        { text: `Telephone: ${existingLab.contact_number1}, email: ${existingLab.contact_email}`, width: 100 },
                    ],
                    {
                        image: labLogoBuffer,
                        width: 50,
                        margin: [0, 0, 0, 0],
                        alignment: 'right'
                    }
                ],
            },
            {
                text: `GST No. ${existingLab.gst_number}`,
                fontSize: 11, bold: true, margin: [0, 10, 0, 0]
            },
            {
                style: 'firstTable',
                table: {
                    widths: ['*', '*'],
                    body: [
                        [
                            { rowSpan: 6, text: `To,\n M/s, ${srf?.contact_name} \n ${srf?.customer?.address1},\n${srf?.customer?.address2},\n${srf?.customer?.address3 ? `${srf?.customer?.address3},\n` : ''}${srf?.customer?.city}, ${srf?.customer?.state} - ${srf?.customer?.pincode}` },
                            { text: `DC No. ${srf?.customer_dc}` }
                        ],
                        ['', { text: `DC Date. ${srf?.customer_dc_date}` }],
                        ['', { text: `SRF No. ${srf?.srf_number}` }],
                        ['', { text: `SRF Date: ${srf?.srf_date}` }],
                        ['', { text: `Contact Person: ${srf?.contact_name}` }],
                        ['', { text: `Contact Person: ${srf?.contact_number}` }]
                    ]
                }
            },
            {
                style: 'mainTable',
                table: {
                    widths: [40, '*', 30, 70, 50, 40, 50],
                    headerRows: 0,
                    body: itemsArray
                }
            },
            {
                style: 'signatureTable',
                table: {
                    widths: [200, '*'],
                    body: [
                        [
                            { text: 'Name & Signature of the CSD', margin: [0, 42, 0, 0] },
                            {
                                ul: [
                                    { text: 'Received the above items in good conditions', listType: 'none' },
                                    { text: 'Name & signature of the customer', listType: 'none', margin: [0, 30, 0, 0] }
                                ]
                            },
                        ],
                    ]
                }
            },
            {
                style: 'remarksTable',
                table: {
                    widths: ['*'],
                    body: [
                        [
                            {
                                text: `Remarks: If any discrepancy found vendor is to revert back within 2 working days, it would be deemed correct & further entertained after 2 working days`,
                                bold: true,
                                margin: [5, 5, 5, 5]
                            }
                        ]
                    ]
                }
            },
            {
                style: 'checkboxTable',
                table: {
                    widths: ['*', '*'],
                    body: [
                        [
                            {
                                columns: [
                                    {
                                        image: (returnAfterCalibration) ? checkedLogoBuffer : unCheckedLogoBuffer,
                                        width: 10,
                                        margin: [5, 5, 0, 0],
                                        alignment: 'left'
                                    },
                                    {
                                        width: '*',
                                        text: 'Returned after calibration',
                                        alignment: 'left',
                                        margin: [10, 3, 0, 0]
                                    }
                                ],
                                columnGap: 0
                            },
                            {
                                columns: [
                                    {
                                        image: (sendForCalibration) ? checkedLogoBuffer : unCheckedLogoBuffer,
                                        width: 10,
                                        margin: [5, 5, 0, 0],
                                        alignment: 'left'
                                    },
                                    {
                                        width: '*',
                                        text: 'Sent for calibration',
                                        alignment: 'left',
                                        margin: [10, 3, 0, 0]
                                    }
                                ],
                                columnGap: 0
                            },
                        ],
                        [
                            {
                                columns: [
                                    {
                                        image: (sendForRepairs) ? checkedLogoBuffer : unCheckedLogoBuffer,
                                        width: 10,
                                        margin: [5, 5, 0, 0],
                                        alignment: 'left'
                                    },
                                    {
                                        width: '*',
                                        text: 'Send for repaires & servicing',
                                        alignment: 'left',
                                        margin: [10, 3, 0, 0]
                                    }
                                ],
                                columnGap: 0
                            },
                            {
                                columns: [
                                    {
                                        image: (returnableMaterial) ? checkedLogoBuffer : unCheckedLogoBuffer,
                                        width: 10,
                                        margin: [5, 5, 0, 0],
                                        alignment: 'left'
                                    },
                                    {
                                        width: '*',
                                        text: 'Returnable material',
                                        alignment: 'left',
                                        margin: [10, 3, 0, 0]
                                    }
                                ],
                                columnGap: 0
                            },
                        ],
                        [
                            {
                                colSpan: 2,
                                columns: [
                                    {
                                        image: (notForSale) ? checkedLogoBuffer : unCheckedLogoBuffer,
                                        width: 10,
                                        margin: [5, 5, 0, 0],
                                        alignment: 'left'
                                    },
                                    {
                                        width: '*',
                                        text: 'Not For Sale',
                                        alignment: 'left',
                                        margin: [10, 3, 0, 0],
                                    }
                                ],
                                columnGap: 0
                            },
                            {},
                        ]
                    ]
                }
            },
            {
                style: 'lastTables',
                table: {
                    widths: ['*', '*', '*'],
                    body: [
                        [`Issue No.: ${srf?.issue_no}`, `Amend No.: ${srf?.amend_no}`, 'TC-FF-002'],
                        [`Issue Date.: ${issue_date}`, `Amend Date.: ${amend_date}`, `${existingLab.lab_name}`],
                    ]
                }
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
        }
    }

    var pdfDocGenerator = pdfMake.createPdf(docDefinition, {});

    pdfDocGenerator.getBuffer(async function (buffer) {

        try {

            const todayDate = new Date().getTime();
            const fileName = `delivery-challan-${todayDate}.pdf`;

            fs.writeFileSync(`./public/delivery-challan/${fileName}`, buffer);

            const pdfURL = path.join(__dirname, '../public/delivery-challan', fileName);

            const transporter = nodemailer.createTransport({
                name: "CalibMaster",
                host: existingLab?.email_smtp_server_host,
                port: existingLab?.email_smtp_server_port,
                secure: true,
                auth: {
                    user: existingLab?.sender_email,
                    pass: existingLab?.sender_password
                }
            });

            const info = await transporter.sendMail({
                from: existingLab?.sender_email,
                to: srf?.contact_email,
                subject: "CalibMaster - Delivery Challan",
                html: "<p><b>Please find delivery challan on attachment.</b></p>",
                priority: "high",
                attachments: [
                    {
                        filename: fileName,
                        content: new Buffer(buffer, 'utf-8')
                    },
                ]
            });
            console.log(info);

            // return res.set({
            //     "Content-Type": "application/pdf",
            //     "Content-Length": buffer.length
            // }).sendFile(pdfURL);

            return res.status(200).json({
                msg: true,
                code: 200,
                msg: "Mail Send Successfully"
            });
        } catch (err) {
            console.log(err);
            const error = new Error("Error when sending the mail");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }
    });
};

exports.create = create;