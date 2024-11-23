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
        let rDay = calibDueDate.getDate();
        let rMonth = calibDueDate.getMonth() + 1;
        let rYear = calibDueDate.getFullYear();
        let calibration_due_date = `${rDay}-${rMonth}-${rYear}`;

        const html = `
            <p>Serial No: ${eachData.serial_no} </p>
            <p>Name Of Equipment: ${eachData.name_of_equipment} </p>
            <p>Calibration Due Date: ${calibration_due_date} </p>
        `;

        const info = await transporter.sendMail({
            from: lab.sender_email,
            to: lab.sender_email,
            subject: "Notification Mail For Master Equipment",
            html: html
        });

        console.log(info);

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

                masterLists.map(async (eachRow) => {

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

                            await sendMail(eachRow);
                        } else {
                            status = `The mail will send the contact person on ${reaminderDate}`
                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });
                        }
                    }
                });

                let data = `Cron Job attempt on Master Equipment calibration_remainder_date_1 at ${new Date()} \n`;

                fs.appendFile("cronLogger.txt", data, function (err) {
                    if (err) throw err;
                });
            } catch (err) {
                console.log(err);
            }

        })
    } catch (err) {
        console.log(err);
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

                masterLists.map(async (eachRow) => {

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

                            await sendMail(eachRow);
                        } else {
                            status = `The mail will send the contact person on ${reaminderDate}`
                            responseArr.push({
                                serial_no: eachRow?.serial_no,
                                status
                            });
                        }
                    }
                });

                let data = `Cron Job attempt on Master Equipment calibration_remainder_date_2 at ${new Date()} \n`;

                fs.appendFile("cronLogger.txt", data, function (err) {
                    if (err) throw err;
                });
            } catch (err) {
                console.log(err);
            }

        })
    } catch (err) {
        console.log(err);
    }
};

module.exports = {
    emailRemainder_1,
    emailRemainder_2
};