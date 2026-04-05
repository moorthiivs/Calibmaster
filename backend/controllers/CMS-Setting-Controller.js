const Lab = require("../models").Lab;
const CMSsettings = require("../models").cmssettings;
const { Op } = require("sequelize");
const { errorHandler } = require("../helpers/error-handler");

const create_cms_certificate = async (req, res, next) => {

    try {
        const { setting_certificate_value } = req.body;

        const fetchCMSsettings = await CMSsettings.findOne();

        if (!fetchCMSsettings) {

            const newCMSsettings = new CMSsettings({
                setting_certificate_value
            });
            const result = await newCMSsettings.save();
            return res
                .status(201)
                .send({ status: 201, result, msg: "CM settings created successfully." });

        } else {

            const response = await fetchCMSsettings.update({
                setting_certificate_value
            });

            return res
                .status(200)
                .send({ status: 200, msg: "CM settings updated successfully.", response });
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

const fetch_cms_certificate = async (req, res, next) => {

    try {

        let result = await CMSsettings.findAll({
            order: [
                ['cmssetting_id', 'ASC'],
            ],
        });

        let labList = await Lab.findAll({
            attributes: { exclude: ['brand_logo'] },
            order: [
                ['lab_id', 'DESC'],
            ]
        });

        if (!result) {
            const error = new Error("There is no Certificate Settings.");
            error.code = 500;
            return errorHandler(error, req, res, next);
        } else {
            return res.status(200).json({
                msg: true,
                response: "CMS Certificate Settings fetched successfully.",
                result, labList
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

const edit_cms_certificate = async (req, res, next) => {

    try {

        const { setting_value, cmssetting_id } = req.body;

        const fetchCMSsettings = await CMSsettings.findOne({
            where: { cmssetting_id: cmssetting_id }
        });

        if (fetchCMSsettings) {

            await fetchCMSsettings.update(
                { setting_value },
                { where: { cmssetting_id: cmssetting_id } }
            )

            return res.status(200).json({
                msg: true, response: "CMS Certificate Setting updated successfully!!!"
            });
        } else {
            const error = new Error("Failed To Update CMS Certificate Setting");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

exports.create_cms_certificate = create_cms_certificate;
exports.fetch_cms_certificate = fetch_cms_certificate;
exports.edit_cms_certificate = edit_cms_certificate;