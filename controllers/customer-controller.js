const { errorHandler } = require("../helpers/error-handler");
const User = require("../models").User;
const customer = require("../models").customer;
const customer_contact = require("../models").customer_contact;
const { Op } = require("sequelize");
const customerSchema = require("../schemas/customer");
const customerContactSchema = require("../schemas/customer-contact");

const createCustomer = async (req, res, next) => {

    if (!req.body || !req.body.customer || !req.body.customer_contact) {
        let action = "All fields are required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let customerObj = {};

    customerObj.customer_name = req.body.customer.customer_name;
    customerObj.customer_code = req.body.customer.customer_code;
    customerObj.address1 = req.body.customer.address1;
    customerObj.address2 = req.body.customer.address2;
    customerObj.address3 = req.body.customer.address3;
    customerObj.city = req.body.customer.city;
    customerObj.state = req.body.customer.state;
    customerObj.country = req.body.customer.country;
    customerObj.pincode = req.body.customer.pincode;

    // *** Customer Parent Data Validation
    const validCustomer = customerSchema(customerObj);
    // return res.json({ validCustomer });

    if (!validCustomer) {
        let action = "Please fill the required customer fields !!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let customerContactObj = {};

    customerContactObj.contact_title = req.body.customer_contact.contact_title;
    customerContactObj.contact_fullname = req.body.customer_contact.contact_fullname;
    customerContactObj.contact_email = req.body.customer_contact.contact_email;
    customerContactObj.contact_phone_1 = req.body.customer_contact.contact_phone_1;
    customerContactObj.contact_phone_2 = req.body.customer_contact.contact_phone_2;

    // *** Customer Contact Data Validation
    const validCustomerContact = customerContactSchema(customerContactObj);
    return res.json({ validCustomerContact });

    try {

        const findCompany = await customer.findOne({
            where: { customer_name: customerObj.customer_name }
        });

        return res.json({ findCompany });

        if (findCompany) {
            let action = "Customer Already exist";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        const newCustomer = new customer({

            customer_name,

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

const editCustomer = async (req, res, next) => {

    const {
        customer_id,
        companyname,
        email,
        address1,
        address2,
        address3
    } = req.body;

    if (!customer_id || !companyname || !email || !address1 || !address2 || !address3) {
        let action = "All fields are required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        // Find the admin 
        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        // Find the customer if it exists
        let findCustomer = await customer.findOne({
            where: { customer_id }
        });

        if (findCustomer) {
            await customer.update(
                {
                    customer_name: companyname,

                    address1,
                    address2,
                    address3,

                    updated_timestamp: Date.now(),
                    updated_by_login_name: fetchCreater.name,
                    updated_by_user_id: req.userId
                },
                { where: { customer_id } }
            )
            return res.status(200).json({
                msg: true, response: "Record updated successfully!!!"
            });
        } else {
            let action = "This is not a valid customer";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
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
exports.editCustomer = editCustomer;