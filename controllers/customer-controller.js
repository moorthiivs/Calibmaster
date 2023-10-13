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

    // create customer object for validation and store in database
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
    customerObj.gst_number = req.body.customer.gst_number;

    // *** Customer Parent Data Validation
    const validCustomer = customerSchema(customerObj);
    // return res.json({ validCustomer });

    if (!validCustomer) {
        let action = "Please fill the required customer fields !!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    // create customer-contact object for validation and store in database
    let customerContactObj = {};

    customerContactObj.contact_title = req.body.customer_contact.contact_title;
    customerContactObj.contact_fullname = req.body.customer_contact.contact_fullname;
    customerContactObj.contact_email = req.body.customer_contact.contact_email;
    customerContactObj.contact_phone_1 = req.body.customer_contact.contact_phone_1;
    customerContactObj.contact_phone_2 = req.body.customer_contact.contact_phone_2;

    // *** Customer Contact Data Validation
    const validCustomerContact = customerContactSchema(customerContactObj);
    // return res.json({ validCustomerContact });

    if (!validCustomerContact) {
        let action = "Please fill the required customer contact fields !!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let customer_id;
    let customerResult;
    let customerContactResult;
    // Fetch the loggedin admin
    const fetchCreater = await User.findOne({
        where: { id: req.userId }
    });

    // Create Customer
    try {
        const findCompany = await customer.findOne({
            where: { customer_name: customerObj.customer_name }
        });

        if (findCompany) {
            let action = "Customer Already exist";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        customerObj.created_timestamp = Date.now();
        customerObj.created_by_login_name = fetchCreater.name;
        customerObj.created_by_user_id = req.userId;

        customerObj.updated_timestamp = Date.now();
        customerObj.updated_by_login_name = fetchCreater.name;
        customerObj.updated_by_user_id = req.userId

        customerObj.lab_id = req.body.labId;
        customerObj.rstatus = 1;

        const newCustomer = new customer(customerObj)

        customerResult = await newCustomer.save();
        customer_id = customerResult.customer_id;

    } catch (err) {
        console.log(err);
        let action = "Something went wrong while saving the customer";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/create";
        return errorHandler(error, req, res, next);
    }

    // *** Create Customer Contact
    try {
        customerContactObj.customer_id = customer_id;

        customerContactObj.created_timestamp = Date.now();
        customerContactObj.created_by_login_name = fetchCreater.name;
        customerContactObj.created_by_user_id = req.userId;

        customerContactObj.updated_timestamp = Date.now();
        customerContactObj.updated_by_login_name = fetchCreater.name;
        customerContactObj.updated_by_user_id = req.userId

        const newCustomerContact = new customer_contact(customerContactObj)

        customerContactResult = await newCustomerContact.save();

    } catch (err) {
        console.log(err);
        let action = "Something went wrong while saving the customer contact";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/create";
        return errorHandler(error, req, res, next);
    }

    return res.status(201).json({
        msg: "Customer Created Successfully",
        customerResult, customerContactResult
    });
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
            include: [{
                model: customer_contact,
                as: "customer_contact",
                attributes: {
                    exclude: [
                        "created_timestamp", "created_by_login_name", "created_by_user_id",
                        "updated_timestamp", "updated_by_login_name", "updated_by_user_id"
                    ]
                }
            }],
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