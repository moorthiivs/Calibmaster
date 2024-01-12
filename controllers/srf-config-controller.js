const User = require("../models").User;
const EParameter = require("../models").EParameter;
const { errorHandler } = require("../helpers/error-handler");

const createConfig = async (req, res, next) => {

    try {
        if (!req.body.issue_no || !req.body.issue_date || !req.body.amend_no || !req.body.amend_date || !req.body.lab_id) {
            const error = new Error("All fields are require");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        const { issue_no, issue_date, amend_no, amend_date, lab_id } = req.body;

        const fetchSRFConfig = await EParameter.findOne({
            where: { lab_id }
        });

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        if (!fetchSRFConfig) {

            const newSRFConfig = new EParameter({
                issue_no, issue_date,
                amend_no, amend_date,
                lab_id,

                created_timestamp: Date.now(),
                created_by_login_name: fetchCreater.name,
                created_by_user_id: req.userId,

                updated_timestamp: Date.now(),
                updated_by_login_name: fetchCreater.name,
                updated_by_user_id: req.userId
            });
            const result = await newSRFConfig.save();
            return res
                .status(201)
                .send({ status: 201, result, msg: "SRF Configaration successfully created." });

        } else {

            const response = await fetchSRFConfig.update({
                issue_no, issue_date,
                amend_no, amend_date,
                lab_id,

                updated_timestamp: Date.now(),
                updated_by_login_name: fetchCreater.name,
                updated_by_user_id: req.userId
            });

            return res
                .status(200)
                .send({ status: 200, msg: "SRF Configaration successfully updated.", response });

        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const fetchConfig = async (req, res, next) => {

    try {

        const lab_id = req.params.lab_id;

        let result = await EParameter.findAll({
            where: { lab_id: `'${lab_id}'` }
        });

        if (!result) {
            const error = new Error("Failed to fetched SRF Configuration");
            error.code = 500;
            return errorHandler(error, req, res, next);
        } else {
            return res.status(200).json({
                msg: true,
                response: "SRF Configuration fetched successfully!!!",
                result
            });
        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const editConfig = async (req, res, next) => {

    try {

        if (!req.body.issue_no || !req.body.issue_date || !req.body.amend_no || !req.body.amend_date || !req.body.lab_id) {
            const error = new Error("All fields are require");
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        const { issue_no, issue_date, amend_no, amend_date, lab_id } = req.body;

        const fetchSRFConfig = await EParameter.findOne({
            where: { lab_id: `'${lab_id}'` }
        });

        if (fetchSRFConfig) {

            const fetchCreater = await User.findOne({
                where: { id: req.userId }
            });


            await EParameter.update(
                {
                    issue_no, issue_date, amend_no, amend_date,

                    updated_timestamp: Date.now(),
                    updated_by_login_name: fetchCreater.name,
                    updated_by_user_id: req.userId
                },
                { where: { lab_id: `'${lab_id}'` } }
            )
            return res.status(200).json({
                msg: true, response: "Record updated successfully!!!"
            });
        } else {
            const error = new Error("Failed To Update Record");
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

exports.createConfig = createConfig;
exports.fetchConfig = fetchConfig;
exports.editConfig = editConfig;