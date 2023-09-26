const instrument = require("../models").instrument;
const User = require("../models").User;
const { errorHandler } = require("../helpers/error-handler");
const instrumentSchema = require("../schemas/instrument");

const ListInstrument = async (req, res, next) => {

    try {
        let instrumentList = await instrument.findAll({
            include: ["UOM", "discipline", "group"],
            order: [
                ['instrument_id', 'DESC']
            ]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Instrument List Fetched Successfully!!",
            data: instrumentList
        });

    } catch (err) {

        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

}

const createInstrument = async (req, res, next) => {

    let {
        instrument_name,
        instrument_uom_id,
        instrument_discipline_id,
        instrument_group_id
    } = req.body;

    if (!instrument_name || !instrument_uom_id) {
        let action = "All fields are required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    try {

        const fetchCreater = await User.findOne({
            where: { id: req.userId }
        });

        const newInstrument = new instrument({
            instrument_name,
            instrument_uom_id,
            instrument_discipline_id: (instrument_discipline_id) ? instrument_discipline_id : null,
            instrument_group_id: (instrument_group_id) ? instrument_group_id : null,

            created_timestamp: Date.now(),
            created_by_login_name: fetchCreater.name,
            created_by_user_id: req.userId,

            updated_timestamp: Date.now(),
            updated_by_login_name: fetchCreater.name,
            updated_by_user_id: req.userId
        })

        const result = await newInstrument.save();
        return res.status(200).json(result);
    } catch (err) {
        console.log(err);
        console.log(err);
        let action = "Failed to create new Instrument";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    res.json({ msg: true })
}

exports.ListInstrument = ListInstrument;
exports.createInstrument = createInstrument;