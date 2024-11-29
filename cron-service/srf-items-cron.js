const Lab = require("../models").Lab;
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const instrument_type = require("../models").instrument_type;
const nodemailer = require("nodemailer");
const cron = require('node-cron');
const fs = require('fs');

// *** Helper/Callback function ***
const sendMail = async (eachData, calibration_remainder) => {

    const { srf, intrument_type, lab } = eachData;

    try {
        // Connecting to the STMP Server
        const transporter = nodemailer.createTransport({
            name: "Next Calibration Notification",
            host: lab?.email_smtp_server_host,
            port: lab?.email_smtp_server_port,
            secure: true,
            auth: {
                user: lab?.sender_email,
                pass: lab?.sender_password
            }
        });

        let identification_detail = eachData?.identification_detail || "";
        let calibration_done_date = eachData?.calibration_done_date || "";
        let url_number = eachData?.url_number || "";
        let certificate_date = eachData?.certificate_date || "";

        let calibDueDate = new Date(eachData?.calibration_due_date);
        let rDay = calibDueDate.getDate().toString().padStart(2, '0');
        let rMonth = (calibDueDate.getMonth() + 1).toString().padStart(2, '0');
        let rYear = calibDueDate.getFullYear();
        let calibration_due_date = `${rDay}-${rMonth}-${rYear}`;

        if (calibration_done_date) {
            let calibDoneDate = new Date(calibration_done_date);
            let dDay = calibDoneDate.getDate().toString().padStart(2, '0');
            let dMonth = (calibDoneDate.getMonth() + 1).toString().padStart(2, '0');
            let dYear = calibDoneDate.getFullYear();
            calibration_done_date = `${dDay}-${dMonth}-${dYear}`;
        }

        let remainder = (calibration_remainder == 1) ? "Remainder 1" : "Remainder 2";

        const html_content = `<html lang="en">
            <head>
                <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Notification Mail</title>
                        <style>
                            body, p, div {
                                margin: 0;
                                padding: 0;
                            }
                            body {
                                font - family: 'Arial', sans-serif;
                                background-color: #f8f9fa;
                                color: #333;
                                box-sizing: border-box;
                            }
                            * {
                                box - sizing: inherit;
                            }
                        </style>
                    </head>
                    <body>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td>
                                    <p style="margin: 0 0 10px;">Dear ${srf?.contact_name || 'Customer'},</p>
                                    <p style="margin: 0 0 10px;">We hope this message finds you well. This is a friendly reminder that the next calibration for your instrument is due soon. Please find the details below for your reference:</p>
                                    <p style="margin: 0 0 10px;"><b>Instrument Information:</b></p>
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td style="padding: 15px;">
                                                <p style="margin: 0 0 5px;"><b>Instrument Full name:</b> ${intrument_type.instrument_full_name}</p>
                                                <p style="margin: 0 0 5px;"><b>Serial number:</b> ${eachData?.serial_no}</p>
                                                <p style="margin: 0 0 5px;"><b>Identification Number:</b> ${identification_detail}</p>
                                                <p style="margin: 0 0 5px;"><b>Last Calibration done date:</b> ${calibration_done_date}</p>
                                                <p style="margin: 0 0 5px;"><b>Calibration due date:</b> ${calibration_due_date}</p>
                                                <p style="margin: 0 0 5px;"><b>ULR number:</b> ${url_number}</p>
                                                <p style="margin: 0 0 5px;"><b>Certificate date:</b> ${certificate_date}</p>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="margin: 0 0 10px;">This is an ${remainder}.<br />Contact us for the next calibration.</p>
                                    <p style="margin: 0 0 10px; font-size: 14px;">Best regards,<br />${lab?.lab_name}</p>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>`;

        const info = await transporter.sendMail({
            from: lab.sender_email,
            to: srf.contact_email,
            subject: `Calibration Reminder ${calibration_remainder}: Important Notification`,
            html: html_content,
            headers: {
                'X-Priority': '1',
                'Importance': 'high',
            }
        });

        return info.messageId;
    } catch (error) {
        console.log(error);
    }
}

const sendNotificationMail_1 = async (req, res) => {
    try {
        cron.schedule('0 0 * * *', async function () { // run every day at 12:00 AM
            try {
                let srfItems = await Item.findAll({
                    attributes: [
                        "serial_no", "identification_details", "calibration_done_date",
                        "url_number", "certificate_date",
                        "calibration_due_date", "calibration_remainder_date_1", "calibration_remainder_date_2"
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
                                "contact_email", "lab_name",
                                "email_smtp_server_host", "email_smtp_server_port", "sender_email", "sender_password"
                            ]
                        }
                    ]
                });

                let responseArr = [];
                let mail_count = 0;

                for (let eachRow of srfItems) {

                    const { email_smtp_server_host, email_smtp_server_port, sender_password, sender_email } = eachRow?.lab;

                    if (eachRow?.calibration_remainder_date_1 && email_smtp_server_host && email_smtp_server_port && sender_password && sender_email) {

                        // *** Reaminder Date in yyyy--mm-dd format ***
                        const rDate = new Date(eachRow?.calibration_remainder_date_1);
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

                            let calibration_remainder = eachRow?.calibration_remainder_date_2 ? 2 : 1;
                            const mailresponse = await sendMail(eachRow, calibration_remainder);
                            mailresponse && mail_count++;
                        } else {
                            status = `The mail will send the contact person on ${reaminderDate}`
                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });
                        }
                    }
                }

                let data = `Cron Job attempt on SRF calibration_remainder_date_1 at ${new Date()} Total sent Mail count: ${mail_count} \n`;
                fs.appendFile("cronLogger.txt", data, function (err) {
                    if (err) throw err;
                });
            } catch (err) {
                console.error('Error during cron job execution:', err);
            }
        });
    } catch (err) {
        console.error('Error with cron job setup:', err);
    }
};

const sendNotificationMail_2 = async (req, res) => {
    try {
        cron.schedule('0 0 * * *', async function () {
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
                                "contact_email", "lab_name",
                                "email_smtp_server_host", "email_smtp_server_port", "sender_email", "sender_password"
                            ]
                        }
                    ]
                });

                let responseArr = [];
                let mail_count = 0;

                for (let eachRow of srfItems) {

                    const { email_smtp_server_host, email_smtp_server_port, sender_password, sender_email } = eachRow?.lab;

                    if (eachRow?.calibration_remainder_date_2 && email_smtp_server_host && email_smtp_server_port && sender_password && sender_email) {

                        // *** Reaminder Date in yyyy--mm-dd format ***
                        const rDate = new Date(eachRow?.calibration_remainder_date_2);
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

                            let calibration_remainder = 1;
                            const mailresponse = await sendMail(eachRow, calibration_remainder);
                            mailresponse && mail_count++;
                        } else {
                            status = `The mail will send the contact person on ${reaminderDate}`
                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });
                        }
                    }
                }

                let data = `Cron Job attempt on SRF calibration_remainder_date_2 at ${new Date()} Total sent Mail count: ${mail_count} \n`;

                fs.appendFile("cronLogger.txt", data, function (err) {
                    if (err) throw err;
                });
            } catch (err) {
                console.error('Error during cron job execution:', err);
            }
        });
    } catch (err) {
        console.error('Error with cron job setup:', err);
    }
};

module.exports = {
    sendNotificationMail_1,
    sendNotificationMail_2
};