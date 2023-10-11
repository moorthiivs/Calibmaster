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



exports.createCustomer = createCustomer;