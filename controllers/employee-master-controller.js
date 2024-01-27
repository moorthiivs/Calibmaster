const { errorHandler } = require("../helpers/error-handler");
const employeeMaster = require("../models").employee_master;
const { Op } = require("sequelize");

const create = async (req, res, next) => {

    try {

        const newEmployeeMaster = new employeeMaster({
            employee_title: req.body.employee_title,
            employee_full_name: req.body.employee_full_name,
            employee_role: req.body.employee_role,
            employee_signature: 'employee_signature/' + req.file.filename,
            employee_enable: "YES"
        });

        const result = await newEmployeeMaster.save();

        res.status(201).json({ msg: "New Employee Created Successfully", result });
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong");
        error.code = 500;
        error.path = "--";
        return errorHandler(error, req, res, next);
    }
}

const list = async (req, res, next) => {

    try {

        let employeeMasterList = await employeeMaster.findAll({
            where: { 'employee_enable': "YES" },
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Employee Master Fetched Successfully!!",
            data: employeeMasterList
        });


    } catch (err) {
        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        error.path = "--";
        return errorHandler(error, req, res, next);
    }
}

const disableEmplyee = async (req, res, next) => {

    try {

        const { employee_id } = req.body;

        let findEmployeeMaster = await employeeMaster.findOne({
            where: { employee_id }
        });

        if (findEmployeeMaster) {

            await findEmployeeMaster.update(
                {
                    employee_enable: "NO"
                },
                { where: { employee_id } }
            );

            return res.status(200).json({
                msg: true, response: "Record updated successfully!!!"
            });
        } else {
            let action = "Employee Master is not available";
            const error = new Error(action);
            error.code = 500;
            error.path = "--";
            return errorHandler(error, req, res, next);
        }
    } catch (err) {
        let action = "Something went wrong, please try again";
        const error = new Error(action);
        error.code = 500;
        error.path = "--";
        return errorHandler(error, req, res, next);
    }
};

const fetchEmployee = async (req, res, next) => {

    try {

        const { employee_id } = req.body;

        let result = await employeeMaster.findOne({
            where: { employee_id, employee_enable: "YES" }
        });

        if (!result) {
            const error = new Error('Failed to fetch Employee');
            error.code = 500;
            error.path = "--";
            return errorHandler(error, req, res, next);
        } else {
            return res.status(200).json({
                msg: true,
                response: "Employee fetched successfully!!!",
                result
            });
        }
    } catch (err) {
        const error = new Error("Something went wrong, please try again");
        error.code = 500;
        error.path = "--";
        return errorHandler(error, req, res, next);
    }
}

const updateEmployee = async (req, res, next) => {

    try {

        const { employee_id, employee_title, employee_full_name, employee_role, employee_enable } = req.body

        if (!employee_id || !employee_title || !employee_full_name || !employee_role || !employee_enable) {
            const error = new Error("Please follow lab guidelines");
            error.code = 500;
            error.path = "/api/uom/edit";
            return errorHandler(error, req, res, next);
        }

        let findEmployeeMaster = await employeeMaster.findOne({
            where: { employee_id }
        });

        if (findEmployeeMaster) {

            let updateData = ""

            if (req?.file?.filename) {
                updateData = {
                    employee_title, employee_full_name, employee_role, employee_enable,
                    employee_signature: 'employee_signature/' + req.file.filename,
                };
            } else {
                updateData = {
                    employee_title, employee_full_name, employee_role, employee_enable
                };
            }

            await findEmployeeMaster.update(updateData, { where: { employee_id } });

            return res.status(200).json({
                msg: true, response: "Record updated successfully!!!"
            });
        } else {
            const error = new Error("Failed To Update Employee Master");
            error.code = 500;
            error.path = "/api/uom/edit";
            return errorHandler(error, req, res, next);
        }
    } catch (err) {
        console.log(err);
        const error = new Error("Something went wrong, please try again");
        error.code = 500;
        error.path = "/api/uom/edit";
        return errorHandler(error, req, res, next);
    }
};

exports.create = create;
exports.list = list;
exports.disableEmplyee = disableEmplyee;
exports.fetchEmployee = fetchEmployee;
exports.updateEmployee = updateEmployee;