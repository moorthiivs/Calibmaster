const labBankDetail = require("../models").bank_details;
const { errorHandler } = require("../helpers/error-handler");

const CreateORUpdate = async (req, res, next) => {

    try {
        const { bank_name, account_number, branch, ifsc_code, lab_id } = req.body;

        const fetchBankConfig = await labBankDetail.findOne({
            where: { lab_id }
        });

        if (!fetchBankConfig) {

            const lutBankSchema = new labBankDetail({
                bank_name, account_number, branch, ifsc_code, lab_id
            });

            const query = await lutBankSchema.save();

            return res.status(201).json({ status: 201, query, msg: "Bank configuration created successfully" });
        } else {

            const query = await fetchBankConfig.update({
                bank_name, account_number, branch, ifsc_code
            });

            return res.status(201).json({ status: 201, query, msg: "Bank configuration updated successfully" });
        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "/api/bank-config-routes/create-or-update";
        return errorHandler(error, req, res, next);
    }
}

const fetchConfig = async (req, res, next) => {

    try {
        const lab_id = req.params.lab_id;

        let result = await labBankDetail.findAll({
            where: { lab_id }
        });

        if (!result) {
            const error = new Error("Failed to fetched Lab Bank Details");
            error.code = 500;
            return errorHandler(error, req, res, next);
        } else {
            return res.status(200).json({
                msg: true,
                response: "Bank Details fetched successfully!!!",
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

module.exports = {
    CreateORUpdate,
    fetchConfig
}