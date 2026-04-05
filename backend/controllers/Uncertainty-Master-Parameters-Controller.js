const UncertaintyMasterParameter = require("../models").uncertainty_master_parameter;
const Joi = require('joi');
const { errorHandler } = require("../helpers/error-handler");

const create = async (req, res, next) => {

    try {

        const { lab_id, name, description, parameter_type, distribution, dividing_factor } = req.body;

        const schema = Joi.object({
            lab_id: Joi.number().required().messages({ 'any.required': `Lab Id is a required field` }),
            name: Joi.string().min(3).required(),
            description: Joi.string().min(3).required(),
            parameter_type: Joi.string().min(1).max(1).required().valid('A', 'B').messages({
                'any.required': `Parameter Type is a required field`,
            }),
            distribution: Joi.string().min(1).required().valid('Normal', 'Rectangular'),
            dividing_factor: Joi.number().required().messages({
                'any.required': `Dividing Factor is a required field`
            }),
        });

        const { error, value } = schema.validate(req.body);

        if (error) {

            const error_msg = error?.details[0]?.message;

            return res.status(500).json(error_msg);
        }
        else {
            req.body.unique_id = new Date().getTime();
            req.body.status = "Active";
            const query = await UncertaintyMasterParameter.create(req.body);
            return res.status(201).json({
                msg: "Record added successfully",
                success: true,
                query
            });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

const fetchById = async (req, res, next) => {

    try {

        const { uncertainty_master_parameter_id, lab_id } = req.params;

        const schema = Joi.object({
            uncertainty_master_parameter_id: Joi.number().required(),
            lab_id: Joi.number().required(),
        });

        const { error, value } = schema.validate(req.params);

        if (error) {
            return res.status(500).json({ error });
        } else {
            const result = await UncertaintyMasterParameter.findOne({
                where: { uncertainty_master_parameter_id, lab_id }
            });
            return res.status(200).json({
                msg: "Record fetched successfully",
                success: true,
                result
            });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

const list = async (req, res, next) => {

    try {

        const { lab_id } = req.params;

        const schema = Joi.object({
            lab_id: Joi.number().required(),
        });

        const { error, value } = schema.validate(req.params);

        if (error) {
            return res.status(500).json({ error });
        } else {
            const query = await UncertaintyMasterParameter.findAll({
                order: [
                    ['uncertainty_master_parameter_id', 'DESC'],
                ],
                where: { lab_id }
            });
            return res.status(200).json({
                msg: "List fetched successfully",
                success: true,
                query
            });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

const update = async (req, res, next) => {

    try {

        const {
            uncertainty_master_parameter_id, lab_id, name, description, parameter_type, distribution, dividing_factor, status
        } = req.body;

        const schema = Joi.object({
            uncertainty_master_parameter_id: Joi.number().required(),
            lab_id: Joi.number().required(),
            name: Joi.string().min(3),
            description: Joi.string().min(3),
            parameter_type: Joi.string().min(1).max(1).valid('A', 'B'),
            distribution: Joi.string().min(1).valid('Normal', 'Rectangular'),
            dividing_factor: Joi.number(),
            status: Joi.string().min(1).valid('Active', 'Inactive'),
        });

        const { error, value } = schema.validate(req.body);

        if (error) {
            return res.status(500).json({ error });
        } else {

            const query = await UncertaintyMasterParameter.update(
                { name, description, parameter_type, distribution, dividing_factor, status },
                {
                    where: { uncertainty_master_parameter_id, lab_id },
                    returning: true,
                },
            );

            return res.status(201).json({
                msg: "Uncertainty Master Parameter updated successfully",
                success: true,
                query
            });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

const updateByStatus = async (req, res, next) => {

    try {

        const {
            uncertainty_master_parameter_id, lab_id, status
        } = req.body;

        const schema = Joi.object({
            uncertainty_master_parameter_id: Joi.number().required(),
            lab_id: Joi.number().required(),
            status: Joi.string().min(1).valid('Active', 'Inactive'),
        });

        const { error, value } = schema.validate(req.body);

        if (error) {

            return res.status(500).json({ error });
        } else {
            const query = await UncertaintyMasterParameter.update(
                { status },
                {
                    where: { uncertainty_master_parameter_id, lab_id },
                    returning: true,
                },
            );

            return res.status(201).json({
                msg: "Uncertainty Master Parameter updated successfully",
                status: true,
                query
            });
        }
    } catch (err) {
        console.log(err)
        res.status(404);
        const error = new Error("Internal Server Error");
        next(errorHandler(error, req, res, next))
    }
}

module.exports = {
    create, fetchById, list, update, updateByStatus
}