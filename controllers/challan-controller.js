const ejs = require('ejs');
const pdf = require('html-pdf');
const puppeteer = require("puppeteer");
const fs = require('fs');
const path = require('path');
const { Buffer } = require('node:buffer');
const nodeMailer = require("nodemailer");

const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const Lab = require("../models").Lab;
const customer = require("../models").customer;
const instrument_type = require("../models").instrument_type;

const { errorHandler } = require("../helpers/error-handler");

// ! Test function-1
const generate = async (req, res, next) => {

    try {

        let existingLab, srf, items;
        let returnAfterCalibration = false;
        let sendForRepairs = false;
        let notForSale = true;
        let sendForCalibration = true;
        let returnableMaterial = false;

        try {
            existingLab = await Lab.findOne({
                where: { lab_id: 1, rstatus: 1 },
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
            action = "Internal Server Error!!";
            const error = new Error("Failed to create buffer");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        try {
            srf = await SRF.findOne({
                where: { srf_id: 70, rstatus: 1 },
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
            const error = new Error("Error on getting parent srf");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        try {
            items = await Item.findAll({
                where: { srf_id: 70, rstatus: 1 },
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
            const error = new Error("Error on getting parent srf");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        const { BACKEND_SERVER } = process?.env;

        const filePathName = path.resolve(__dirname, '../views/deliverychallan.ejs');

        const htmlString = fs.readFileSync(filePathName).toString();

        let options = {
            "height": "10.5in",
            "width": "9in",
            "paginationOffset": 1,
            "footer": {
                "height": "10mm",
                "contents": {
                    first: '<div style="text-align: center;">{{page}}/{{pages}}</div>',
                    2: '<div style="text-align: center;">{{page}}/{{pages}}</div>',
                    default: `<div style="text-align: center;">
                        <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>
                    </div>`,
                    last: 'Last Page'
                }
            }
        };

        const ejsData = ejs.render(htmlString, {
            existingLab, BACKEND_SERVER, srf, items,
            returnAfterCalibration, sendForRepairs, notForSale, sendForCalibration, returnableMaterial
        })

        const fileUniqueName = `${new Date().getTime()}.pdf`;

        pdf.create(ejsData, options).toFile(`./delivery-challan/${fileUniqueName}`, async (err, response) => {
            if (err) throw err;

            const nodemailer = require("nodemailer");

            var transporter = nodemailer.createTransport({
                host: "sandbox.smtp.mailtrap.io",
                port: 2525,
                auth: {
                    user: "631a07952c0a3a",
                    pass: "8bc03ff401deb1"
                }
            });

            const info = await transporter.sendMail({
                from: '<sender@example.com>',
                to: ["anirbankreative22@gmail.com", "pathaksangita930@gmail.com"],
                subject: "Test PDF Mail Send",
                attachments: [
                    {
                        path: response.filename
                    }
                ]
            });

            return res.json({ response, info });
        });
    } catch (err) {
        console.log(err);
        const error = new Error("Error when sending the mail");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

// ! Test function-2
const pdfCreateNode = async (req, res, next) => {

    try {

        let existingLab, srf, items;
        let returnAfterCalibration = false;
        let sendForRepairs = false;
        let notForSale = true;
        let sendForCalibration = true;
        let returnableMaterial = false;

        try {
            existingLab = await Lab.findOne({
                where: { lab_id: 1, rstatus: 1 },
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
            action = "Internal Server Error!!";
            const error = new Error("Failed to create buffer");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        try {
            srf = await SRF.findOne({
                where: { srf_id: 70, rstatus: 1 },
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
            const error = new Error("Error on getting parent srf");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        try {
            items = await Item.findAll({
                where: { srf_id: 70, rstatus: 1 },
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
            const error = new Error("Error on getting parent srf");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        const { BACKEND_SERVER } = process?.env;

        const fileUniqueName = `${new Date().getTime()}.pdf`;

        const filePathName = path.resolve(__dirname, '../views/deliverychallan.ejs');

        let browser = await puppeteer.launch({ headless: "new" });
        const [page] = await browser.pages();

        const html = await ejs.renderFile(filePathName, {
            existingLab, BACKEND_SERVER, srf, items,
            returnAfterCalibration, sendForRepairs, notForSale, sendForCalibration, returnableMaterial
        });
        await page.setContent(html);
        const pdf = await page.pdf({
            path: `delivery-challan/${fileUniqueName}`,
            format: "A4",
            displayHeaderFooter: true,
            footerTemplate: `<div style=\"text-align: right;width: 1000mm;font-size: 20px;\">
                <span style=\"margin-right: 1cm\"><span class=\"pageNumber\"></span> 
                of 
                <span class=\"totalPages\"></span></span>
            </div>`
        });

        // res.contentType("application/pdf");
        // res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
        // res.send(pdf);

        const nodemailer = require("nodemailer");

        var transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "631a07952c0a3a",
                pass: "8bc03ff401deb1"
            }
        });

        const info = await transporter.sendMail({
            from: '<sender@example.com>',
            to: ["anirbankreative22@gmail.com", "pathaksangita930@gmail.com"],
            subject: "Test PDF Mail Send",
            attachments: [
                {
                    filename: fileUniqueName,
                    content: Buffer.from(pdf, 'utf-8')
                }
            ]
        });

        return res.json({ fileUniqueName, info });

    } catch (err) {
        console.log(err);
        const error = new Error("Error when sending the mail");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const sendDeliveryChallan = async (req, res, next) => {

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

    const { BACKEND_SERVER } = process?.env;

    const filePathName = path.resolve(__dirname, '../views/deliverychallan.ejs');

    const htmlString = fs.readFileSync(filePathName).toString();

    let options = {
        "height": "10.5in",
        "width": "9in",
        "paginationOffset": 1,
        "footer": {
            "height": "10mm",
            "contents": {
                first: '<div style="text-align: center;">{{page}}/{{pages}}</div>',
                2: '<div style="text-align: center;">{{page}}/{{pages}}</div>',
                default: `<div style="text-align: center;">
                        <span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>
                    </div>`,
                last: 'Last Page'
            }
        }
    };

    const ejsData = ejs.render(htmlString, {
        existingLab, BACKEND_SERVER, srf, items,
        returnAfterCalibration, sendForRepairs, notForSale, sendForCalibration, returnableMaterial
    });

    const fileUniqueName = `${new Date().getTime()}.pdf`;

    const transporter = nodeMailer.createTransport({
        name: "CalibMaster",
        host: existingLab?.email_smtp_server_host,
        port: existingLab?.email_smtp_server_port,
        secure: true,
        auth: {
            user: existingLab?.sender_email,
            pass: existingLab?.sender_password
        }
    });

    pdf.create(ejsData, options).toFile(`./delivery-challan/${fileUniqueName}`, async (err, response) => {
        if (err) throw err;

        try {
            const info = await transporter.sendMail({
                from: existingLab?.sender_email,
                to: srf?.contact_email,
                subject: "CalibMaster - Delivery Challan",
                html: "<p><b>Please find delivery challan on attachment.</b></p>",
                priority: "high",
                attachments: [
                    {
                        path: response.filename,
                        filename: 'delivery-challan.pdf',
                        contentType: "application/pdf",
                    }
                ]
            });

            console.log(info);

            return res.status(200).json({
                status: "SUCCESS",
                code: 205,
                message: "Mail sent Successfully",
            });

        } catch (err) {
            console.log(err);
            const error = new Error("Error when sending the mail");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }
    });
}

exports.generate = generate;
exports.pdfCreateNode = pdfCreateNode;
exports.sendDeliveryChallan = sendDeliveryChallan;
