const { errorHandler } = require("../helpers/error-handler");
const Srf = require("../models").srf_list;
const SrfItem = require("../models").srfitem;
const User = require("../models").User;
const Lab = require("../models").Lab;

const editCalibrationDueDate = async (req, res) => {

    try {
        const calibration_due_date = 'Thu Oct 19 2023 00:00:00 GMT+0530 (India Standard Time)';

        let response = await SrfItem.update(
            {
                calibration_due_date
            },
            { where: { srf_item_id: 1 } }
        )

        res.json({
            msg: response
        })
    } catch (error) {
        console.log(error);
    }
};

const calculateCalibrationReminderDate = async (req, res) => {

    const {
        srf_id,
        srf_item_id
    } = req.body;

    let srfResult = await Srf.findOne({
        attributes: ['reminder_frequency'],
        where: { srf_id }
    })

    let srfItemResult = await SrfItem.findOne({
        attributes: ['calibration_due_date'],
        where: { srf_item_id }
    })

    let { reminder_frequency } = srfResult;
    let { calibration_due_date } = srfItemResult;

    // *** add due_date + 1 day
    let due_date = new Date(calibration_due_date);
    due_date = due_date.setDate(due_date.getDate() + 1)
    due_date = new Date(due_date);

    // *** Calculation Calibration Reaminder Date ***
    let diffDateInMS = due_date.setDate(due_date.getDate() - reminder_frequency);
    let calibration_reaminder_date = new Date(diffDateInMS);

    const update_calibration_reaminder_date = await SrfItem.update(
        {
            calibration_reaminder_date
        },
        { where: { srf_item_id } }
    )

    // ! Till this upper code part will be added as api when the Generate Certificate button will be clicked

    // *** Today Date in yyyy--mm-dd format ***
    const todayDate = new Date();
    let day = todayDate.getDate();
    let month = todayDate.getMonth() + 1;
    let year = todayDate.getFullYear();
    let currentDate = `${year}-${month}-${day}`;

    // *** Reaminder Date in yyyy--mm-dd format ***
    rDate = calibration_reaminder_date;
    let rDay = rDate.getDate() - 1;
    let rMonth = rDate.getMonth() + 1;
    let rYear = rDate.getFullYear();
    let reaminderDate = `${rYear}-${rMonth}-${rDay}`;

    let status;
    if (currentDate === reaminderDate) {
        status = "lets today send the mail to contact person"
    } else {
        status = "will send the mail to contact person when date arrives"
    }

    res.json({
        reminder_frequency, calibration_reaminder_date,
        currentDate, reaminderDate, status,
        update_calibration_reaminder_date
    })
}

const updateCalibrationReminderDate = async (req, res) => {

    const {
        srf_id,
        srf_item_id,
        calibration_due_date
    } = req.body;

    if (!srf_id || !srf_item_id || !calibration_due_date) {
        let action = "There is a missing in payload";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    // *** SET Calibration Due Date ***
    try {
        let dueDate = new Date(calibration_due_date);
        dueDate.setDate(dueDate.getDate() - 1);

        let response = await SrfItem.update(
            {
                calibration_due_date: dueDate,
            },
            { where: { srf_item_id } }
        );

    } catch (err) {
        let action = "Failed to update calibration due date";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    // *** SET Calibration Reaminder Date ***
    try {
        let srfResult = await Srf.findOne({
            attributes: ['reminder_frequency'],
            where: { srf_id }
        });

        let { reminder_frequency } = srfResult;

        // *** add due_date + 1 day
        let due_date = new Date(calibration_due_date);

        // *** Calculation Calibration Reaminder Date ***
        let diffDateInMS = due_date.setDate(due_date.getDate() - reminder_frequency - 1);
        let calibration_reaminder_date = new Date(diffDateInMS);

        await SrfItem.update(
            {
                calibration_reaminder_date
            },
            { where: { srf_item_id } }
        );

        return res.json({
            reminder_frequency,
            calibration_due_date,
            calibration_reaminder_date
        })

    } catch (err) {
        let action = "Failed to update calibration reaminder date";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

exports.editCalibrationDueDate = editCalibrationDueDate;
exports.calculateCalibrationReminderDate = calculateCalibrationReminderDate;
exports.updateCalibrationReminderDate = updateCalibrationReminderDate;