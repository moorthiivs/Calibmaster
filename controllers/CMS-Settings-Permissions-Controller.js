const { errorHandler } = require("../helpers/error-handler");
const CMSsettingsPermissions = require("../models").cmssettings_permissions;
const { Op } = require("sequelize");

const create = async (req, res, next) => {

    try {
        const { lab_id, setting_name, setting_lable, setting_description, setting_value, is_enable } = req.body;

        const fetchConfig = await CMSsettingsPermissions.findOne({
            where: { lab_id, setting_name }
        });

        // return res.json(fetchConfig);

        if (!fetchConfig) {

            const newSRFConfig = new CMSsettingsPermissions({
                lab_id,
                setting_name, setting_lable, setting_description, setting_value, is_enable
            });
            const result = await newSRFConfig.save();
            return res
                .status(201)
                .send({ status: 201, result, msg: "Configaration successfully created." });

        } else {

            const response = await fetchConfig.update({
                lab_id,
                setting_name, setting_lable, setting_description, setting_value, is_enable
            });

            return res
                .status(200)
                .send({ status: 200, msg: "Configaration successfully updated.", response });
        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const fetch = async (req, res, next) => {

    const { lab_id } = req.body

    try {

        let result = await CMSsettingsPermissions.findAll({
            where: { lab_id: lab_id },
            order: [
                ['cmssetting_permission_id', 'ASC'],
            ],
        });

        if (!result) {
            const error = new Error("There is no Certificate Settings.");
            error.code = 500;
            return errorHandler(error, req, res, next);
        } else {
            return res.status(200).json({
                msg: true,
                response: "CMS Certificate Settings fetched successfully.",
                result
            });
        }

    } catch (err) {
        console.log(err);
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        error.path = "-";
        return errorHandler(error, req, res, next);
    }
};

const edit = async (req, res, next) => {

    try {

        const { lab_id, setting_name, setting_lable, setting_description, setting_value, is_enable } = req.body;

        const fetchConfig = await CMSsettingsPermissions.findOne({
            where: { lab_id, setting_name }
        });

        if (fetchConfig) {

            const response = await fetchConfig.update({
                lab_id,
                setting_name, setting_lable, setting_description, setting_value, is_enable
            });

            return res
                .status(200)
                .send({ status: 200, msg: "Configaration successfully updated.", response });

        } else {
            return res
                .status(404)
                .send({ status: 404, msg: "Failed to Updated Configaration." });
        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

exports.create = create;
exports.fetch = fetch;
exports.edit = edit;