var fs = require('fs');
var path = require('path');
const User = require("../models").User;
const MasterListEquipment = require("../models").MasterListEquipment;

const { errorHandler } = require("../helpers/error-handler");
const { decodeBase64Image } = require("../helpers/image-decoded-handler");

function StoreMasterCalibrationImage(imageData) {
    try {
        const dirPath = path.join(__dirname, '../master_certificates');

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        const DecodeImg = decodeBase64Image(imageData);
        const imageBuffer = DecodeImg.data;
        const fileExtension = DecodeImg.type.split('/')[1];
        const imgFileName = `${Math.floor(Math.random() * 9999999)}-master.${fileExtension}`;
        const filePath = path.join(dirPath, imgFileName);
        fs.writeFileSync(filePath, imageBuffer);

        return imgFileName;
    } catch (err) {
        console.error('Error storing image:', err);
        return null;
    }
}

const create = async (req, res, next) => {

    try {

        // const {
        //     lab_id
        // } = req.body;

        // if (!lab_id) {
        //     const error = new Error("All fields are required");
        //     error.code = 500;
        //     return errorHandler(error, req, res, next);
        // }

        try {

            // Find Logged in user
            const fetchCreater = await User.findOne({
                where: { id: req.userId }
            });

            let calibration_due_date = req.body.calibration_valid_upto;
            let calibration_remainder_date_1 = "";
            let calibration_remainder_date_2 = "";

            if (req.body.next_calibration_reminder === "1 Reminder 7 days before") {

                let due_date_1 = new Date(calibration_due_date);
                let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 7);
                req.body.calibration_remainder_date_1 = new Date(diffDateInMS_1);
            }

            if (req.body.next_calibration_reminder === "2 Reminders 15 days before") {

                let due_date_1 = new Date(calibration_due_date);
                let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 15);
                req.body.calibration_remainder_date_1 = new Date(diffDateInMS_1);

                let due_date_2 = new Date(calibration_due_date);
                let diffDateInMS_2 = due_date_2.setDate(due_date_2.getDate() - 7);
                req.body.calibration_remainder_date_2 = new Date(diffDateInMS_2);
            }

            // return res.json({ calibration_due_date, calibration_remainder_date_1, calibration_remainder_date_2 });

            req.body.created_timestamp = Date.now();
            req.body.created_by_login_name = fetchCreater.name;
            req.body.created_by_user_id = req.userId;

            req.body.updated_timestamp = Date.now();
            req.body.updated_by_login_name = fetchCreater.name;
            req.body.updated_by_user_id = req.userId;
            req.body.mastercertificate_filename = StoreMasterCalibrationImage(req.body.master_calibration);
            delete req.body.master_calibration;

            if (!req.body.mastercertificate_filename) {
                let action = "master calibration file error";
                const error = new Error(action);
                error.code = 500;
                return errorHandler(error, req, res, next);
            }

            const newMasterListEquipment = new MasterListEquipment(req.body);
            const result = await newMasterListEquipment.save();

            return res
                .status(201)
                .json({ status: "SUCCESS", msg: "Record created successfully", code: 201, result });

        } catch (err) {
            console.log(err);
            let action = "Something went wrong";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

    } catch (err) {
        console.log(err);
        const error = new Error("Failed to create this record.");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const list = async (req, res, next) => {

    const { lab_id } = req.body;

    try {

        let list = await MasterListEquipment.findAll({
            where: { lab_id },
            order: [
                ['master_list_equipment_id', 'DESC'],
            ]
        });

        let counter = 1;
        for (let i = 0; i < list.length; i++) {
            list[i].dataValues.id = counter++;
        }

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Master Equipment List Fetched Successfully!!",
            data: list
        });

    } catch (err) {
        console.log(err);
        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const find = async (req, res, next) => {

    const { master_list_equipment_id } = req.body;

    if (!master_list_equipment_id) {
        const error = new Error("Master equipment id not found");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        let result = await MasterListEquipment.findOne({
            where: { master_list_equipment_id }
        });

        if (!result) {
            const error = new Error("Failed to fetch Master equipment");
            error.code = 500;
            return errorHandler(error, req, res, next);
        } else {
            return res.status(200).json({
                response: "Master equipment fetched successfully!!!", code: 200, result
            });
        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong, please try again");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const update = async (req, res, next) => {

    try {

        const {
            master_list_equipment_id,
        } = req.body;

        if (
            !master_list_equipment_id
        ) {
            const error = new Error("Master Equipment Id is required");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        let result = await MasterListEquipment.findOne({
            where: { master_list_equipment_id }
        });

        let calibration_due_date = req.body.calibration_valid_upto;
        let calibration_remainder_date_1 = "";
        let calibration_remainder_date_2 = "";

        if (req.body.next_calibration_reminder === "1 Reminder 7 days before") {

            let due_date_1 = new Date(calibration_due_date);
            let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 7);
            req.body.calibration_remainder_date_1 = new Date(diffDateInMS_1);
            req.body.calibration_remainder_date_2 = null;
        }

        if (req.body.next_calibration_reminder === "2 Reminders 15 days before") {

            let due_date_1 = new Date(calibration_due_date);
            let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 15);
            req.body.calibration_remainder_date_1 = new Date(diffDateInMS_1);

            let due_date_2 = new Date(calibration_due_date);
            let diffDateInMS_2 = due_date_2.setDate(due_date_2.getDate() - 7);
            req.body.calibration_remainder_date_2 = new Date(diffDateInMS_2);
        }

        // return res.json({
        //     calibration_valid_upto: req.body.calibration_valid_upto,
        //     calibration_remainder_date_1: req.body.calibration_remainder_date_1,
        //     calibration_remainder_date_2: req.body.calibration_remainder_date_2
        // })

        req.body.updated_timestamp = Date.now();
        req.body.updated_by_login_name = fetchCreater.name;
        req.body.updated_by_user_id = req.userId;

        if (req.body.master_calibration) {
            req.body.mastercertificate_filename = StoreMasterCalibrationImage(req.body.master_calibration);
        }
        if (req.body.master_calibration && !req.body.mastercertificate_filename) {
            let action = "Master calibration file error";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }
        delete req.body.master_calibration;

        // return res.json(req.body);

        if (result) {
            await MasterListEquipment.update(
                req.body,
                { where: { master_list_equipment_id } }
            )
            return res.status(200).json({
                msg: true, code: 200, response: "Record updated successfully!!!"
            });
        } else {
            const error = new Error("This is not a valid request");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

    } catch (err) {
        console.log(err);
        const error = new Error("Failed to update this record.");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

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

        return res.json(responseArr);

    } catch (err) {
        console.log(err);
    }
};

const viewCertificate = async (req, res, next) => {

    try {
        const { filename } = req.body;
        const docPath = path.join(__dirname, "..", "master_certificates", filename);

        return res.sendFile(docPath);
    } catch (err) {
        console.log(err);
        let action = "Failed to download master";
        const error = new Error(action);
        error.code = 500;
        error.path = "Download Master";
        return errorHandler(error, req, res, next);
    }
}


const deleteMaster = async (req, res, next) => {
    try {
        const { master_list_equipment_id } = req.body;

        if (!master_list_equipment_id) {
            const error = new Error("Master equipment ID not found");
            error.code = 400; // Change to 400 (Bad Request)
            return errorHandler(error, req, res, next);
        }

        let result = await MasterListEquipment.findOne({
            where: { master_list_equipment_id }
        });

        if (!result) {
            const error = new Error("Master equipment not found");
            error.code = 404; // Change to 404 (Not Found)
            return errorHandler(error, req, res, next);
        }

        // If data exists, delete it
        await MasterListEquipment.destroy({
            where: { master_list_equipment_id }
        });

        return res.status(200).json({
            response: "Master equipment deleted successfully!!!",
            code: 200
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};


exports.create = create;
exports.list = list;
exports.find = find;
exports.update = update;
exports.emailRemainder = emailRemainder;
exports.viewCertificate = viewCertificate;
exports.deleteMaster = deleteMaster
