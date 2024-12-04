const MasterListEquipment = require("../models").MasterListEquipment;
const nodemailer = require("nodemailer");
const cron = require('node-cron');
const fs = require('fs');

// *** Helper/Callback function ***
const sendMail = async (eachData) => {

    const { lab } = eachData;

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

        let calibDueDate = new Date(eachData?.calibration_valid_upto);
        let rDay = calibDueDate.getDate().toString().padStart(2, '0');
        let rMonth = (calibDueDate.getMonth() + 1).toString().padStart(2, '0');
        let rYear = calibDueDate.getFullYear();
        let calibration_due_date = `${rDay}-${rMonth}-${rYear}`;

        const html = `<html lang="en">
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
                                    <p style="margin: 0 0 10px;">Dear Team,</p>
                                    <p style="margin: 0 0 10px;">This is a reminder that the following equipment's calibration is due:</p>
                                    <p style="margin: 0 0 0 15px;"><b>Serial No:</b> ${eachData.serial_no} </p>
                                    <p style="margin: 0 0 0 15px;"><b>Name Of Equipment:</b> ${eachData.name_of_equipment} </p>
                                    <p style="margin: 0 0 10px 15px;"><b>Calibration Due Date:</b> ${calibration_due_date} </p>
                                    <p style="margin: 0 0 10px;">Please ensure that the calibration is completed before the due date to maintain compliance and ensure equipment accuracy.</p>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>`

        const info = await transporter.sendMail({
            from: lab.sender_email,
            to: lab.sender_email,
            subject: "Notification Mail For Master Equipment",
            html: html
        });

        return info.messageId;
    } catch (error) {
        console.log(error);
    }
}

const emailRemainder_1 = async (req, res, next) => {

    try {

        cron.schedule('0 0 * * *', async function () {  // run every day at 12:00 AM

            try {
                let masterLists = await MasterListEquipment.findAll({
                    include: ['lab']
                });

                let responseArr = [];
                let mail_count = 0;

                for (let eachRow of masterLists) {

                    const { email_smtp_server_host, email_smtp_server_port, sender_password, sender_email } = eachRow?.lab;

                    if (eachRow?.calibration_remainder_date_1 && email_smtp_server_host && email_smtp_server_port && sender_password && sender_email) {

                        // *** Reaminder Date in yyyy--mm-dd format ***
                        const rDate = new Date(eachRow?.calibration_remainder_date_1);
                        let rDay = rDate.getDate().toString().padStart(2, '0');
                        let rMonth = (rDate.getMonth() + 1).toString().padStart(2, '0');
                        let rYear = rDate.getFullYear();
                        let reaminderDate = `${rYear}-${rMonth}-${rDay}`;

                        // *** Today Date in yyyy--mm-dd format ***
                        const currentDate = new Date().toLocaleString("en-CA", { timeZone: "Asia/Kolkata" }).split(',')[0];

                        let status;

                        if (currentDate === reaminderDate) {
                            status = "Today send the mail to contact person";

                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });

                            const mailresponse = await sendMail(eachRow);
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

                const currentDate = new Date().toLocaleString("en-CA", {
                    timeZone: "Asia/Kolkata",
                    weekday: "short",
                    year: "2-digit",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                });
                let data = `Cron Job attempt on Master Equipment calibration_remainder_date_1 at ${currentDate} Total sent Mail: ${mail_count} \n`;

                fs.appendFile("cronLogger.txt", data, function (err) {
                    if (err) throw err;
                });
            } catch (err) {
                console.error('Error during cron job execution:', err);
            }

        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"  // Set the timezone to India Standard Time (IST)
        })
    } catch (err) {
        console.error('Error with cron job setup:', err);
    }
};

const emailRemainder_2 = async (req, res, next) => {

    try {

        cron.schedule('0 0 * * *', async function () {

            try {
                let masterLists = await MasterListEquipment.findAll({
                    include: ['lab']
                });

                let responseArr = [];
                let mail_count = 0;

                for (let eachRow of masterLists) {

                    const { email_smtp_server_host, email_smtp_server_port, sender_password, sender_email } = eachRow?.lab;

                    if (eachRow?.calibration_remainder_date_2 && email_smtp_server_host && email_smtp_server_port && sender_password && sender_email) {

                        // *** Reaminder Date in yyyy--mm-dd format ***
                        const rDate = new Date(eachRow?.calibration_remainder_date_2);
                        let rDay = rDate.getDate().toString().padStart(2, '0');
                        let rMonth = (rDate.getMonth() + 1).toString().padStart(2, '0');
                        let rYear = rDate.getFullYear();
                        let reaminderDate = `${rYear}-${rMonth}-${rDay}`;

                        // *** Today Date in yyyy--mm-dd format ***
                        const currentDate = new Date().toLocaleString("en-CA", { timeZone: "Asia/Kolkata" }).split(',')[0];

                        let status;

                        if (currentDate === reaminderDate) {
                            status = "Today send the mail to contact person";

                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });

                            const mailresponse = await sendMail(eachRow);
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

                const currentDate = new Date().toLocaleString("en-CA", {
                    timeZone: "Asia/Kolkata",
                    weekday: "short",
                    year: "2-digit",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false
                });
                let data = `Cron Job attempt on Master Equipment calibration_remainder_date_2 at ${currentDate} Total sent Mail: ${mail_count} \n`;

                fs.appendFile("cronLogger.txt", data, function (err) {
                    if (err) throw err;
                });
            } catch (err) {
                console.error('Error during cron job execution:', err);
            }

        }, {
            scheduled: true,
            timezone: "Asia/Kolkata"  // Set the timezone to India Standard Time (IST)
        })
    } catch (err) {
        console.error('Error with cron job setup:', err);
    }
};

module.exports = {
    emailRemainder_1,
    emailRemainder_2
};