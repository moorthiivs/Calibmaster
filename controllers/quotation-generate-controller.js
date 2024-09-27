var fs = require("fs")
var pdfMake = require("pdfmake/build/pdfmake");
var pdfFonts = require("pdfmake/build/vfs_fonts");
pdfMake.vfs = pdfFonts.pdfMake.vfs;
const imageDataURI = require('image-data-uri');
const nodemailer = require("nodemailer");
const path = require('path');
const Lab = require("../models").Lab;
const quotation_config = require("../models").quotation_config;
const quotation_generation = require("../models").quotation_generation;
const labBankDetail = require("../models").bank_details;
const quotation_customer_contact = require("../models").quotation_customer_contact;
const { errorHandler } = require("../helpers/error-handler");

async function imageToBuffer(imagePath) {
    try {
        return await imageDataURI.encodeFromFile(imagePath).then(dataURI => dataURI)
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const config_quotation = async (req, res, next) => {

    let panNumber = req.body.quotationDetail.panNumber;
    let HSN_SAC = req.body.quotationDetail?.HSN_SAC;
    let labShortName = req.body.quotationDetail?.labShortName;
    let quotationShortName = req.body.quotationDetail?.quotationShortName;
    let currentFinancialYear = req.body.quotationDetail?.currentFinancialYear;
    let runningQuotationNumber = req.body.quotationDetail?.runningQuotationNumber;
    let gstPercentage = req.body.quotationDetail.gstPercentage
    const lab_id = req.body.lab_id;

    if (!lab_id) {
        const error = new Error("lab Details are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
    if (!panNumber || !HSN_SAC || !labShortName || !quotationShortName || !currentFinancialYear || !gstPercentage) {
        const error = new Error("All fields are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        const lab = await Lab.findOne({
            where: {
                lab_id: lab_id
            }
        });

        let gstNumber = lab.dataValues.gst_number;

        const fetchBankConfig = await labBankDetail.findOne({
            where: { lab_id }
        });

        if (!fetchBankConfig) {
            const error = new Error("Complete Bank Configuration!!");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        let quotationConfigResult;
        let quotationDetail = {};


        let CurrentRunningQuotationNumber = runningQuotationNumber.toString().padStart(4, "0");

        let Actual_Running_Quotation_Number = `${labShortName}/${quotationShortName}${currentFinancialYear + "" + (parseInt(currentFinancialYear) + 1)}/${CurrentRunningQuotationNumber}`


        quotationDetail.GST_number = gstNumber;
        quotationDetail.PAN_number = panNumber;
        quotationDetail.Bank_account_number = fetchBankConfig.dataValues.account_number;
        quotationDetail.Bank_name = fetchBankConfig.dataValues.bank_name;
        quotationDetail.IFSC_code = fetchBankConfig.dataValues.ifsc_code;
        quotationDetail.branch = fetchBankConfig.dataValues.branch;
        quotationDetail.HSN_SAC = HSN_SAC;

        quotationDetail.Lab_Short_Name = labShortName;
        quotationDetail.Quotation_Short_Name = quotationShortName;
        quotationDetail.Current_Financial_Year = currentFinancialYear;
        quotationDetail.Running_Quotation_Number = CurrentRunningQuotationNumber;
        quotationDetail.GST_Percentage = gstPercentage;
        quotationDetail.Actual_Running_Quotation_Number = Actual_Running_Quotation_Number;
        quotationDetail.lab_id = lab_id;

        const findExistLabQuotationConfig = await quotation_config.findOne({
            where: {
                lab_id: lab_id,
            }
        });

        if (findExistLabQuotationConfig) {

            quotationConfigResult = await quotation_config.update(
                quotationDetail,
                {
                    where: {
                        lab_id: lab_id
                    }
                })
            return res
                .status(200)
                .send({ success: true, status: 200, msg: "Quotation updated successfully", quotationConfigResult });
        }
        else {
            const newQuotationConfig = new quotation_config(quotationDetail);
            quotationConfigResult = await newQuotationConfig.save();
        }
        return res
            .status(200)
            .send({ success: true, status: 200, msg: "Quotation configured successfully", quotationConfigResult });

    }
    catch (err) {
        console.log(err);
        let action = "Something went wrong while saving the Quotation Details";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/quotation/config-quotation";
        return errorHandler(error, req, res, next);
    }
}

const createQuotation = async (req, res, next) => {
    try {

        const date = new Date();
        let monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const { customer_Detail, customer_item_description, lab_id } = req.body;

        if (!lab_id) {
            const error = new Error("lab Details are required");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        if (!customer_Detail || !customer_item_description) {
            const error = new Error("All fields are required");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        let existingLab;

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
            const error = new Error("Failed to find existing Lab");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        if (!existingLab?.email_smtp_server_host && !existingLab?.email_smtp_server_port && !existingLab?.sender_email && !existingLab?.sender_password) {
            const error = new Error("SMTP server not found. Check your configuration");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }
        let existingQuotaionconfig;

        try {
            existingQuotaionconfig = await quotation_config.findOne({
                where: {
                    lab_id: lab_id
                }
            })
            if (!existingQuotaionconfig) {
                const error = new Error("Failed to find existing Lab Quotation Configuration");
                error.code = 500;
                return errorHandler(error, req, res, next);
            }

        } catch (err) {
            console.log(err);
            const error = new Error("Failed to find existing Lab Quotation Configuration");
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
                { text: "SL.No", alignment: "center", fontSize: 9, bold: true, fillColor: '#A0DEFF' },
                { text: "ITEM DESCRIPTION", fontSize: 9, bold: true, alignment: "center", fillColor: '#A0DEFF' },
                { text: "RANGE / MODEL", fontSize: 9, bold: true, alignment: "center", fillColor: '#A0DEFF' },
                { text: "REMARKS", fontSize: 9, bold: true, alignment: "center", fillColor: '#A0DEFF' },
                { text: "QTY", fontSize: 9, bold: true, alignment: "center", fillColor: '#A0DEFF' },
                { text: "UNIT PRICE", fontSize: 9, bold: true, alignment: "center", fillColor: '#A0DEFF' },
                { text: "TOTAL PRICE INR", fontSize: 9, bold: true, alignment: "center", fillColor: '#A0DEFF' }
            ]
        ]

        for (let i = 0; i < customer_item_description.length; i++) {
            const keys = [
                `${i + 1}`,
                `${customer_item_description[i].itemDescription}`,
                `${customer_item_description[i].range_model}`,
                `${customer_item_description[i].remarks}`,
                `${customer_item_description[i].qty}`,
                `${customer_item_description[i].unitPrice}`,
                `${customer_item_description[i].unitPrice * customer_item_description[i].qty}`
            ]
            itemsArray.push(keys);
        }

        const { GST_Percentage } = existingQuotaionconfig;

        let TotalPriceBasic = 0;
        for (let i = 0; i < customer_item_description.length; i++) {
            let val = (customer_item_description[i].unitPrice * customer_item_description[i].qty)
            TotalPriceBasic = TotalPriceBasic + val;
        }
        let otherCharges = req.body.otherCharges;
        let subTotal = TotalPriceBasic + parseInt(otherCharges);
        let GST = (subTotal * parseInt(GST_Percentage)) / 100;
        let GrandTotal = (subTotal + GST).toFixed(2);

        let quotationGenerationDate = date.getDate() + " " + monthNames[date.getMonth()] + " " + date.getFullYear();

        let currentQuotation = {};
        let currentQuotationCustomerContact = {};
        let quotation_detail_id;

        let newQuotationResult;
        let quotationCustomerContactResult;

        const { Lab_Short_Name, Quotation_Short_Name, Current_Financial_Year, Running_Quotation_Number } = existingQuotaionconfig;
        let CurrentRunningQuotationNumber = Running_Quotation_Number.padStart(4, "0");

        let Quotation_Number = `${Lab_Short_Name}/${Quotation_Short_Name}${Current_Financial_Year + "" + (parseInt(Current_Financial_Year) + 1)}/${CurrentRunningQuotationNumber}`

        try {
            currentQuotation.customer_name = customer_Detail.customer_name;
            currentQuotation.customer_company_name = customer_Detail.company_name;
            currentQuotation.customer_Contact_number = customer_Detail.contactNumber;
            currentQuotation.customer_email = customer_Detail.email;
            currentQuotation.quotation_date = quotationGenerationDate;
            currentQuotation.quotation_number = Quotation_Number;
            currentQuotation.quotation_items = customer_item_description;
            currentQuotation.other_charges = +otherCharges;
            currentQuotation.lab_id = lab_id;

            const newQuotation = new quotation_generation(currentQuotation);
            newQuotationResult = await newQuotation.save();

            quotation_detail_id = newQuotation.quotation_detail_id;

        } catch (err) {
            console.log(err);
            const error = new Error("Something went Wrong while saving Quotation item");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        //create quotation customer contact

        try {

            currentQuotationCustomerContact.quotation_detail_id = quotation_detail_id;
            currentQuotationCustomerContact.customer_name = customer_Detail.customer_name;
            currentQuotationCustomerContact.customer_company_name = customer_Detail.company_name;
            currentQuotationCustomerContact.customer_address_1 = customer_Detail.address1;
            currentQuotationCustomerContact.customer_address_2 = customer_Detail.address2;
            currentQuotationCustomerContact.customer_address_3 = customer_Detail.address3;
            currentQuotationCustomerContact.customer_city = customer_Detail.city;
            currentQuotationCustomerContact.customer_state = customer_Detail.state;
            currentQuotationCustomerContact.customer_pincode = customer_Detail.pincode;
            currentQuotationCustomerContact.customer_Contact_number = customer_Detail.contactNumber;
            currentQuotationCustomerContact.customer_email = customer_Detail.email;

            const newQuotationcustomer = new quotation_customer_contact(currentQuotationCustomerContact);

            quotationCustomerContactResult = await newQuotationcustomer.save();

        } catch (err) {
            console.log(err);
            let action = "Something went wrong while saving the customer contact";
            const error = new Error(action);
            error.code = 400;
            error.path = "/api/quotation/create-quotation";
            return errorHandler(error, req, res, next);
        }

        try {
            var docDefinition = {
                pageSize: "A4",
                pageOrientation: "portrait",
                pageMargins: [20, 20, 20, 20],
                content: [
                    {
                        alignment: "justify",
                        columns: [
                            {
                                margin: [0, 20, 0, 0],
                                image: labLogoBuffer,
                                width: 150,
                                height: 75
                            },
                            {
                                stack: [
                                    {
                                        text: "Quotation",
                                        fontSize: 14,
                                        bold: true,
                                        alignment: "right"
                                    },
                                    {
                                        margin: [150, 0, 0, 0],
                                        table: {
                                            widths: ["*", "*"],
                                            body: [
                                                [{ text: "Quotation No : ", alignment: "center", fontSize: 7, bold: true }, { text: `${Quotation_Number}`, alignment: "center", fontSize: 7, bold: true }],
                                                [{ text: "Quotation Date :", alignment: "center", fontSize: 7 }, { text: `${quotationGenerationDate}`, alignment: "center", fontSize: 7 }],
                                                [{ text: "GST No", alignment: "center", fontSize: 7 }, { text: `${existingQuotaionconfig.GST_number}`, alignment: "center", fontSize: 7 }],
                                                [{ text: "PAN No", alignment: "center", fontSize: 7 }, { text: `${existingQuotaionconfig.PAN_number}`, alignment: "center", fontSize: 7 }],
                                                [{ text: "Bank Account No", alignment: "center", fontSize: 7 }, { text: `${existingQuotaionconfig.Bank_account_number}`, alignment: "center", fontSize: 7 }],
                                                [{ text: "Bank Name", alignment: "center", fontSize: 7 }, { text: `${existingQuotaionconfig.Bank_name}`, alignment: "center", fontSize: 7 }],
                                                [{ text: "Branch", alignment: "center", fontSize: 7 }, { text: `${existingQuotaionconfig.branch}`, alignment: "center", fontSize: 7 }],
                                                [{ text: "IFSC Code", alignment: "center", fontSize: 7 }, { text: `${existingQuotaionconfig.IFSC_code}`, alignment: "center", fontSize: 7 }],
                                                [{ text: "HSN/SAC", alignment: "center", fontSize: 7 }, { text: `${existingQuotaionconfig.HSN_SAC}`, alignment: "center", fontSize: 7 }]
                                            ],
                                        },
                                    }
                                ],
                                alignment: "right"
                            }
                        ]
                    },
                    { text: "Customer Address:", fontSize: 11, bold: true, margin: [0, 0, 0, 13] },
                    { text: `Attention:Mr/Ms: ${customer_Detail.customer_name}`, fontSize: 11, bold: true, margin: [0, 0, 0, 17] },
                    { text: `${customer_Detail.company_name}`, fontSize: 10, margin: [0, 0, 0, 0] },
                    { text: `${customer_Detail.address1},${customer_Detail.address2 ? customer_Detail.address2 : ""}`, fontSize: 10, margin: [0, 0, 0, 0] },
                    { text: `${customer_Detail.address3 ? customer_Detail.address3 : ""}`, fontSize: 10, margin: [0, 0, 0, 0] },
                    { text: `${customer_Detail.city},${customer_Detail.state},${customer_Detail.pincode}`, fontSize: 10, margin: [0, 0, 0, 10] },
                    { text: `Telephone : ${customer_Detail.contactNumber}`, fontSize: 10, bold: true, margin: [0, 0, 0, 0] },
                    {
                        text: [
                            { text: "Email: ", bold: true, fontSize: 10 },
                            { text: `${customer_Detail.email}`, link: `${customer_Detail.email}`, fontSize: 10, color: "blue", decoration: "underline" }
                        ],
                        margin: [0, 0, 0, 15]
                    },
                    { text: `With reference to the Mail request on ${quotationGenerationDate} , please find below prices for Calibartion.`, margin: [0, 0, 0, 10], fontSize: 9 },
                    {
                        style: "mainTable",
                        table: {

                            widths: [30, 150, 90, 90, 25, 45, 60],
                            body: itemsArray
                        },
                        layout: {
                            hLineColor: function (i, node) {
                                return (i === 0) ? 'black' : (i === node.table.body.length) ? 'white' : 'black';
                            },
                        }
                    },
                    {
                        table: {
                            widths: [30, 150, 90, 90, 25, 45, 60],
                            body: [
                                [{ text: "Basics", alignment: "right", bold: true, fontSize: 9, colSpan: 6 }, {}, {}, {}, {}, {}, { text: `${TotalPriceBasic}`, fontSize: 9, alignment: "center" }],
                                [{ text: "other charges", alignment: "right", bold: true, fontSize: 9, colSpan: 6 }, {}, {}, {}, {}, {}, { text: `${otherCharges}`, fontSize: 9, alignment: "center" }],
                                [{ text: "Sub Total", alignment: "right", fontSize: 9, bold: true, colSpan: 6 }, {}, {}, {}, {}, {}, { text: `${subTotal}`, fontSize: 9, alignment: "center" }],
                                [{ text: `GST @ ${GST_Percentage}%`, alignment: "right", fontSize: 9, bold: true, colSpan: 6 }, {}, {}, {}, {}, {}, { text: `${GST}`, fontSize: 9, alignment: "center" }],
                                [{ text: "Grand Total", alignment: "right", fontSize: 9, bold: true, colSpan: 6 }, {}, {}, {}, {}, {}, { text: `${GrandTotal}`, bold: true, fontSize: 9, alignment: "center" }]
                            ]
                        }
                    },
                    {
                        margin: [20, 20, 0, 0],
                        columns: [
                            { width: 25, text: "Note:", color: "red", bold: true, fontSize: 9 },
                            {
                                fontSize: 8,
                                ol: [
                                    { text: "Onsite Conveyance Charges Per Vist 1000/-", fontSize: 8, margin: [0, 0, 0, 5] },
                                    { text: "Micro Meter Each Setting Rod 100/-Rs", fontSize: 8, margin: [0, 0, 0, 5] },
                                    { text: "Calibartion Done Electronic Weighing Scale Up to 100 Kg", fontSize: 8, margin: [0, 0, 0, 5] },
                                ]
                            }
                        ]
                    },
                    { text: "", pageBreak: "before" },
                    { text: "Terms and Conditions", bold: true, fontSize: 9, decoration: "underline", margin: [0, 20, 0, 0] },
                    { text: "General :", bold: true, fontSize: 9 },
                    {
                        fontSize: 8,
                        margin: [40, 0, 0, 0],
                        ol: [
                            { text: "Commencement of job only after receipt of PO", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: "100% Payment against work completion. Certificates will only be released upon receipt of payment.", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: "Payments shall be made in the form of Cheque /DD in favour of M/s. Testcal payable at Bangalore", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: "Charges may vary after physical inspection of the instrument wherever applicable", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: "Calibration will be restricted to the quantities specified in PO", fontSize: 8, margin: [0, 0, 0, 5] },
                        ]
                    },
                    { text: "Onsite :", bold: true, fontSize: 9 },
                    {
                        fontSize: 8,
                        margin: [40, 0, 0, 0],
                        ol: [
                            { text: "Onsite jobs shall be scheduled 3 days in advance.", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: "Jobs executed out of bangalore conveyance , to and fro travel charges, stay , local hospitality and charges for handling of equipments shall be borne by customer Or a lumpsum shall be paid by the customer as per the Quote.", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: "Removing and fixing of instruments is in customer scope or chargeble basis.", fontSize: 8, margin: [0, 0, 0, 5] },
                        ]
                    },
                    { text: "Certificates :", bold: true, fontSize: 9 },
                    {
                        fontSize: 8,
                        margin: [40, 0, 110, 0],
                        ol: [
                            { text: "Re Calibration of any instruments will be charged.", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: "Reissue of certificates shall be on a chargeble basis.", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: "Any modification needed after issuing the certificate, charges will be extra.", fontSize: 8, margin: [0, 0, 0, 5] },
                        ]
                    },
                    { text: "packing & Courier :", bold: true, fontSize: 9 },
                    {
                        fontSize: 8,
                        margin: [40, 0, 100, 0],
                        ol: [
                            { text: "Adequate packing shall be taken care by customer while submitting the equipments to our representative or by courier.", fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: " Customers shall plan for covering Transit Insurance for their equipments which are sent through Courier if required and Testcal is not responsible for any claims", fontSize: 8, margin: [0, 0, 0, 5] },
                        ]
                    },

                    { text: "Thanks & Regards,", fontSize: 8, margin: [0, 20, 0, 0] },
                    {

                        image: labLogoBuffer,
                        fit: [130, 40],
                        margin: [0, 10, 0, 0]
                    },
                    { text: `${existingLab.address1}`, fontSize: 9, margin: [0, 10, 0, 0] },
                    { text: `${existingLab.address2 ? existingLab.address2 : ""}`, fontSize: 9, margin: [0, 4, 0, 0] },
                    { text: `${existingLab.address3 ? existingLab.address3 : ""}`, fontSize: 9, margin: [0, 4, 0, 0] },
                    { text: `${existingLab.city}-${existingLab.pincode},`, fontSize: 9, margin: [0, 4, 0, 0] },
                    { text: `${existingLab.contact_number1}  |  ${existingLab.contact_number2},`, fontSize: 9, margin: [0, 4, 0, 0] },
                    {
                        margin: [0, 10, 0, 0],
                        text: [
                            {
                                text: "Email : ",
                                fontSize: 9,
                            },
                            {
                                text: `${existingLab.contact_email} | `,
                                fontSize: 9
                            },
                            {
                                text: " Web : ",
                                fontSize: 9,
                            },
                            {
                                text: `${existingLab.lab_website}`,
                                link: `${existingLab.lab_website}`,
                                fontSize: 9,
                                color: "blue",
                                decoration: "underline"
                            }
                        ]
                    }
                ],
                styles: {
                    mainTable: {
                        alignment: "center",
                        fontSize: 9
                    }
                }
            }
        } catch (err) {
            console.log(err);
            const error = new Error("Error While Generating Quotation");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }
        var pdfDocGenerator = pdfMake.createPdf(docDefinition, {});

        pdfDocGenerator.getBuffer(async function (buffer) {
            try {

                const todayDate = new Date().getTime();
                const fileName = `quotation-${todayDate}.pdf`;

                fs.writeFileSync(`./quotation/${fileName}`, buffer);

                await quotation_generation.update({ quotation_filename: fileName }, { where: { quotation_detail_id: newQuotationResult.dataValues.quotation_detail_id } });

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
                    to: customer_Detail.email,
                    subject: "CalibMaster - Quotation",
                    html: "<p><b>Please find Quotation on attachment.</b></p>",
                    priority: "high",
                    attachments: [
                        {
                            filename: fileName,
                            content: buffer,
                            contentType: 'application/pdf'
                        },
                    ]
                });
                if (info) {

                    let updateRunningNumber = (parseInt(Running_Quotation_Number) + 1);
                    let CurrentRunningQuotationNumber = updateRunningNumber.toString().padStart(4, "0");
                    let Actual_Running_Quotation_Number = `${Lab_Short_Name}/${Quotation_Short_Name}${Current_Financial_Year + "" + (parseInt(Current_Financial_Year) + 1)}/${CurrentRunningQuotationNumber}`;


                    try {
                        await quotation_config.update({
                            Running_Quotation_Number: updateRunningNumber,
                            Actual_Running_Quotation_Number: Actual_Running_Quotation_Number
                        },
                            {
                                where: {
                                    lab_id: lab_id
                                }
                            })

                    } catch {
                        console.log(err);
                        const error = new Error("Running Number is not updated!!");
                        error.code = 500;
                        return errorHandler(error, req, res, next);
                    }
                }

                return res.status(200).json({
                    success: true,
                    msg: true,
                    code: 200,
                    msg: "Mail has sent Successfully"
                })
            }
            catch (err) {
                console.log(err);
                const error = new Error("Error Quotaion is not created!!");
                error.code = 500;
                return errorHandler(error, req, res, next);
            }
        })
    } catch (err) {
        console.log(err);
        const error = new Error("Something Went Wrong!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }


}

const fetch_quotation_config = async (req, res, next) => {

    const lab_id = req.params.lab_id;

    if (!lab_id) {
        const error = new Error("lab Detail are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let LabQuotationConfig;
    try {
        LabQuotationConfig = await quotation_config.findAll({
            where: {
                lab_id: lab_id
            },
            attributes: {
                exclude: [
                    "Bank_name",
                    "Bank_account_number",
                    "IFSC_code",
                    "lab_id",
                    "branch",
                ]
            }
        });


    } catch (err) {
        console.log(err);
        const error = new Error("Error while fetching Quotation Configuration!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
    return res.status(200).json({ status: "success", msg: "Quotation Configuration fetched successfully!!", LabQuotationConfig })
}


const update_config_quotation = async (req, res, next) => {

    let panNumber = req.body.quotationDetail.panNumber;
    let HSN_SAC = req.body.quotationDetail?.HSN_SAC;
    let labShortName = req.body.quotationDetail?.labShortName;
    let quotationShortName = req.body.quotationDetail?.quotationShortName;
    let currentFinancialYear = req.body.quotationDetail?.currentFinancialYear;
    let runningQuotationNumber = req.body.quotationDetail?.runningQuotationNumber;
    let gstPercentage = req.body.quotationDetail.gstPercentage

    const lab_id = req.body.lab_id;



    if (!lab_id) {
        const error = new Error("lab Detail are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
    if (!runningQuotationNumber || !panNumber || !HSN_SAC || !labShortName || !quotationShortName || !currentFinancialYear || !gstPercentage) {
        const error = new Error("All fields are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let CurrentRunningQuotationNumber = runningQuotationNumber.toString().padStart(4, "0");
    let Actual_Running_Quotation_Number = `${labShortName}/${quotationShortName}${currentFinancialYear + "" + (parseInt(currentFinancialYear) + 1)}/${CurrentRunningQuotationNumber}`

    let quotationDetail = {};

    quotationDetail.PAN_number = panNumber;
    quotationDetail.HSN_SAC = HSN_SAC;

    quotationDetail.Lab_Short_Name = labShortName;
    quotationDetail.Quotation_Short_Name = quotationShortName;
    quotationDetail.Current_Financial_Year = currentFinancialYear;
    quotationDetail.Running_Quotation_Number = runningQuotationNumber;
    quotationDetail.GST_Percentage = gstPercentage;
    quotationDetail.Actual_Running_Quotation_Number = Actual_Running_Quotation_Number;

    try {

        let UpdatequotationConfig = await quotation_config.update(
            quotationDetail,
            {
                where: {
                    lab_id: lab_id
                }
            })

        return res
            .status(200)
            .send({ success: true, status: 200, msg: "Quotation updated successfully", UpdatequotationConfig });
    } catch (err) {
        console.log(err);
        let action = "Something went wrong while updating the Quotation Details";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/quotation/update-config-quotation";
        return errorHandler(error, req, res, next);
    }

}


const fetch_quotation_customer_list = async (req, res, next) => {

    const lab_id = req.params.lab_id;

    if (!lab_id) {
        const error = new Error("lab Detail are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let LabQuotationCustomer;
    try {
        LabQuotationCustomer = await quotation_generation.findAll({
            where: {
                lab_id: lab_id
            },
            attributes: ['customer_company_name', 'customer_name', 'customer_Contact_number', 'customer_email', 'quotation_number', 'quotation_filename'],
            include: [{
                model: quotation_customer_contact,
                as: "quotation_customer_contact",
            }],
            order: [
                ['quotation_detail_id', 'DESC']
            ]
        });

    } catch (err) {
        console.log(err);
        const error = new Error("Error while fetching Quotation Configuration!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
    return res.status(200).json({ status: "success", msg: "Quotation Configuration fetched successfully!!", LabQuotationCustomer })

}

const download = async (req, res, next) => {
    console.log("34")
    try {
        const { filename } = req.body;

        const docPath = path.join(__dirname, "..", "quotation", filename);

        return res.sendFile(docPath);
    } catch (err) {
        console.log(err);
        let action = "Failed to download quotation";
        const error = new Error(action);
        error.code = 500;
        error.path = "Download Quotation";
        return errorHandler(error, req, res, next);
    }
}

exports.fetch_quotation_customer_list = fetch_quotation_customer_list;
exports.fetch_quotation_config = fetch_quotation_config;
exports.config_quotation = config_quotation;
exports.createQuotation = createQuotation;
exports.update_config_quotation = update_config_quotation;
exports.download = download;
