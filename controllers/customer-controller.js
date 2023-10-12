const { errorHandler } = require("../helpers/error-handler");
const User = require("../models").User;
const customer = require("../models").customer;
const { Op } = require("sequelize");

const createCustomer = async (req, res, next) => {

    const {
        companyname,
        email,
        address1,
        address2,
        address3,
        labId
    } = req.body;

    if (!companyname || !email || !address1 || !address2 || !address3 || !labId) {
        let action = "All fields are required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        const newCustomer = new customer({

            customer_name: companyname,
            customer_code: new Date().getTime() * Math.floor(Math.random() * (9999 - 1111 + 1) + 1111),

            address1,
            address2,
            address3,

            lab_id: labId,

            created_timestamp: Date.now(),
            created_by_login_name: fetchCreater.name,
            created_by_user_id: req.userId,

            updated_timestamp: Date.now(),
            updated_by_login_name: fetchCreater.name,
            updated_by_user_id: req.userId
        })

        const result = await newCustomer.save();
        res.status(200).json({ msg: true, result });
    } catch (err) {

        console.log(err);
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/create";
        return errorHandler(error, req, res, next);
    }
};

const listCustomer = async (req, res, next) => {

    const { labId } = req.body;

    if (!labId) {
        let action = "labId is required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {
        let customerList = await customer.findAll({
            where: { 'lab_id': labId },
            order: [
                ['customer_id', 'DESC'],
            ]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Company List Fetched Successfully!!",
            data: customerList
        });
    } catch (err) {
        console.log(err);
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const fetchCustomer = async (req, res, next) => {

    const customer_id = req.params.id;

    if (!customer_id) {
        let action = "Customer id is required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        let result = await customer.findOne({
            where: { customer_id }
        })

        if (!result) {
            let action = "Failed to fetch customer";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        } else {

            return res.status(200).json({
                msg: true, response: "Customer fetched successfully!!!", result
            });
        }

    } catch (err) {
        let action = "Something went wrong, please try again";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

exports.createCustomer = createCustomer;
exports.listCustomer = listCustomer;
exports.fetchCustomer = fetchCustomer;