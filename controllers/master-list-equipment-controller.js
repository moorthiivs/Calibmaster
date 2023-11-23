const User = require("../models").User;
const MasterListEquipment = require("../models").MasterListEquipment;

const { errorHandler } = require("../helpers/error-handler");

const create = async (req, res, next) => {

    try {

        const {
            asset_identification_no,
            equipment_name,
            equipment_make_or_nodel,
            equipment_serial_no,
            range_size,
            least_count,
            accuracy_or_acceptance,
            year_of_purchase,
            calibrated_by,
            date_of_calibration,
            calibration_due_date,
            calibration_certificate_no,
            uncertainty,
            frequency_of_calibration
        } = req.body;

        if (
            !asset_identification_no || !equipment_name || !equipment_make_or_nodel || !equipment_serial_no ||
            !range_size || !least_count || !accuracy_or_acceptance || !year_of_purchase || !calibrated_by ||
            !date_of_calibration || !calibration_due_date || !calibration_certificate_no || !uncertainty ||
            !frequency_of_calibration
        ) {
            const error = new Error("All fields are required");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        try {

            //Checking MasterListEquipment in Database
            var existingMasterListEquipment = await MasterListEquipment.findOne(
                { where: { asset_identification_no } }
            );

            if (existingMasterListEquipment) {
                let action = "This asset identification no is Already Associate with another Master Equipment";
                const error = new Error(action);
                error.code = 401;
                return errorHandler(error, req, res, next);
            }

            // Find Logged in user
            const fetchCreater = await User.findOne({
                where: { id: req.userId }
            });

            req.body.created_timestamp = Date.now();
            req.body.created_by_login_name = fetchCreater.name;
            req.body.created_by_user_id = req.userId;

            req.body.updated_timestamp = Date.now();
            req.body.updated_by_login_name = fetchCreater.name;
            req.body.updated_by_user_id = req.userId;

            const newMasterListEquipment = new MasterListEquipment(req.body);
            const result = await newMasterListEquipment.save();
            return res.status(201).json({ status: "SUCCESS", msg: "Record created successfully", code: 201, result });

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
    try {

        let list = await MasterListEquipment.findAll({
            order: [
                ['master_list_equipment_id', 'DESC'],
            ]
        });

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
            asset_identification_no,
            equipment_name,
            equipment_make_or_nodel,
            equipment_serial_no,
            range_size,
            least_count,
            accuracy_or_acceptance,
            year_of_purchase,
            calibrated_by,
            date_of_calibration,
            calibration_due_date,
            calibration_certificate_no,
            uncertainty,
            frequency_of_calibration
        } = req.body;

        if (
            !master_list_equipment_id || !asset_identification_no || !equipment_name || !equipment_make_or_nodel ||
            !equipment_serial_no || !range_size || !least_count || !accuracy_or_acceptance || !year_of_purchase ||
            !calibrated_by || !date_of_calibration || !calibration_due_date || !calibration_certificate_no || !uncertainty ||
            !frequency_of_calibration
        ) {
            const error = new Error("All fields are required");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        let result = await MasterListEquipment.findOne({
            where: { master_list_equipment_id }
        });

        if (result) {
            await MasterListEquipment.update(
                {
                    asset_identification_no,
                    equipment_name,
                    equipment_make_or_nodel,
                    equipment_serial_no,
                    range_size,
                    least_count,
                    accuracy_or_acceptance,
                    year_of_purchase,
                    calibrated_by,
                    date_of_calibration,
                    calibration_due_date,
                    calibration_certificate_no,
                    uncertainty,
                    frequency_of_calibration,

                    updated_timestamp: Date.now(),
                    updated_by_login_name: fetchCreater.name,
                    updated_by_user_id: req.userId
                },
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

exports.create = create;
exports.list = list;
exports.find = find;
exports.update = update;
