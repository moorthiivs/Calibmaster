const Lab = require("./models").Lab;
const SRF = require("./models").srf_list;
const Item = require("./models").srfitem;
const instrument_type = require("./models").instrument_type;
const nodemailer = require("nodemailer");
const cron = require('node-cron');
const fs = require('fs');

// *** Helper/Callback function ***
const sendMail = async (eachData, calibration_remainder) => {

    const { srf, intrument_type, lab } = eachData;

    try {
        // Connecting to the STMP Server
        const transporter = nodemailer.createTransport({
            host: lab?.email_smtp_server_host,
            port: lab?.email_smtp_server_port,
            auth: {
                user: lab?.sender_email,
                pass: lab?.sender_password
            }
        });

        let identification_detail = (eachData?.identification_detail) ? eachData?.identification_detail : "--";
        let calibration_done_date = (eachData?.calibration_done_date) ? eachData?.calibration_done_date : "--";
        let url_number = (eachData?.url_number) ? eachData?.url_number : "--";
        let certificate_date = (eachData?.certificate_date) ? eachData?.certificate_date : "--";

        let calibDueDate = new Date(eachData?.calibration_due_date);
        let rDay = calibDueDate.getDate();
        let rMonth = calibDueDate.getMonth() + 1;
        let rYear = calibDueDate.getFullYear();
        let calibration_due_date = `${rDay}-${rMonth}-${rYear}`;
        let remainder = (calibration_remainder == 1) ? "Remainder 1" : "Remainder 2";

        const html = `
            <p>Instrument Full name: ${intrument_type.instrument_full_name} </p>
            <p>Serial number: ${eachData?.serial_no} </p>
            <p>Identification Number: ${identification_detail} </p>
            <p>Last Calibration done date: ${calibration_done_date} </p>
            <p>Calibration due date: ${calibration_due_date} </p>
            <p>ULR number: ${url_number} </p>
            <p>Certificate date: ${certificate_date} </p>
            <p>This is : ${remainder} </p>
            <p>Contact us for next calibration.</p>
        `;

        const info = await transporter.sendMail({
            from: lab.contact_email,
            to: srf.contact_email,
            subject: "Notification Mail",
            html: html
        });

        return info.messageId;
    } catch (error) {
        console.log(error);
    }
}

const sendNotificationMail_1 = async (req, res) => {
    try {
        cron.schedule('*/1 * * * *', async function () {
            try {
                let srfItems = await Item.findAll({
                    attributes: [
                        "serial_no", "identification_details", "calibration_done_date",
                        "url_number", "certificate_date",
                        "calibration_due_date", "calibration_remainder_date_1",
                    ],
                    include: [
                        {
                            model: SRF,
                            as: "srf",
                            attributes: [
                                "srf_number", "contact_name", "contact_email"
                            ]
                        },
                        {
                            model: instrument_type,
                            as: "intrument_type",
                            attributes: [
                                "instrument_type_id", "instrument_full_name"
                            ]
                        },
                        {
                            model: Lab,
                            as: "lab",
                            attributes: [
                                "contact_email",
                                "email_smtp_server_host", "email_smtp_server_port", "sender_email", "sender_password"
                            ]
                        }
                    ]
                });

                let responseArr = [];

                srfItems.map(async (eachRow) => {

                    if (eachRow?.calibration_remainder_date_1) {

                        // *** Reaminder Date in yyyy--mm-dd format ***
                        rDate = new Date(eachRow?.calibration_remainder_date_1);
                        let rDay = rDate.getDate();
                        let rMonth = rDate.getMonth() + 1;
                        let rYear = rDate.getFullYear();
                        let reaminderDate = `${rYear}-${rMonth}-${rDay}`;

                        // *** Today Date in yyyy--mm-dd format ***
                        const todayDate = new Date();
                        let day = todayDate.getDate();
                        let month = todayDate.getMonth() + 1;
                        let year = todayDate.getFullYear();
                        let currentDate = `${year}-${month}-${day}`;

                        let status;

                        if (currentDate === reaminderDate) {
                            status = "Today send the mail to contact person";

                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });

                            let calibration_remainder = 1
                            await sendMail(eachRow, calibration_remainder);
                        } else {
                            status = `The mail will send the contact person on ${reaminderDate}`
                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });
                        }
                    }
                });

                let data = `Cron Job attempt on calibration_remainder_date_1 ${new Date()} \n`;

                fs.appendFile("cronLogger.txt", data, function (err) {
                    if (err) throw err;
                });
            } catch (err) {
                console.log(err);
            }
        });
    } catch (err) {
        console.log(err);
    }
}

const sendNotificationMail_2 = async (req, res) => {
    try {
        cron.schedule('*/1 * * * *', async function () {
            try {
                let srfItems = await Item.findAll({
                    attributes: [
                        "serial_no", "identification_details", "calibration_done_date",
                        "url_number", "certificate_date",
                        "calibration_due_date", "calibration_remainder_date_2",
                    ],
                    include: [
                        {
                            model: SRF,
                            as: "srf",
                            attributes: [
                                "srf_number", "contact_name", "contact_email"
                            ]
                        },
                        {
                            model: instrument_type,
                            as: "intrument_type",
                            attributes: [
                                "instrument_type_id", "instrument_full_name"
                            ]
                        },
                        {
                            model: Lab,
                            as: "lab",
                            attributes: [
                                "contact_email",
                                "email_smtp_server_host", "email_smtp_server_port", "sender_email", "sender_password"
                            ]
                        }
                    ]
                });

                let responseArr = [];

                srfItems.map(async (eachRow) => {

                    if (eachRow?.calibration_remainder_date_2) {

                        // *** Reaminder Date in yyyy--mm-dd format ***
                        rDate = new Date(eachRow?.calibration_remainder_date_2);
                        let rDay = rDate.getDate();
                        let rMonth = rDate.getMonth() + 1;
                        let rYear = rDate.getFullYear();
                        let reaminderDate = `${rYear}-${rMonth}-${rDay}`;

                        // *** Today Date in yyyy--mm-dd format ***
                        const todayDate = new Date();
                        let day = todayDate.getDate();
                        let month = todayDate.getMonth() + 1;
                        let year = todayDate.getFullYear();
                        let currentDate = `${year}-${month}-${day}`;

                        let status;

                        if (currentDate === reaminderDate) {
                            status = "Today send the mail to contact person";

                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });

                            let calibration_remainder = 2
                            await sendMail(eachRow, calibration_remainder);
                        } else {
                            status = `The mail will send the contact person on ${reaminderDate}`
                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });
                        }
                    }
                });

                let data = `Cron Job attempt on calibration_remainder_date_2 at ${new Date()} \n`;

                fs.appendFile("cronLogger.txt", data, function (err) {
                    if (err) throw err;
                });
            } catch (err) {
                console.log(err);
            }
        });
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    sendNotificationMail_1,
    sendNotificationMail_2
}