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
            subject: "Notification Mail",
            html: html
        });

        console.log(info);

        return info.messageId;
    } catch (error) {
        console.log(error);
    }
}

const emailRemainder = async (req, res, next) => {

    try {

        cron.schedule('0 * * * *', async function () {

            try {
                let masterLists = await MasterListEquipment.findAll({
                    include: ['lab']
                });
                // return res.json(masterLists);

                let responseArr = [];

                masterLists.map(async (eachRow) => {

                    // *** Reaminder Date in yyyy--mm-dd format ***
                    rDate = new Date(eachRow?.calibration_valid_upto);
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
                    console.log(currentDate, reaminderDate);

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
    emailRemainder
};