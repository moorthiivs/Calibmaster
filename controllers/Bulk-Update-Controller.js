const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const { errorHandler } = require("../helpers/error-handler");

const updateServiceDoneDate = async (req, res, next) => {

    if (!req.body.labId || !req.body.items || !req.body.srfId || !req.body.servicing_done_date) {
        const error = new Error("All Fiels are required.");
        error.code = 400;
        return errorHandler(error, req, res, next);
    }

    let ids = [];
    req.body.items.map((v, i) => {
        ids.push(v.srf_item_id);
    });
    // return res.json(ids);

    const { labId, servicing_done_date } = req.body;

    try {
        await Item.update(
            {
                status: "Servicing",
                servicing_done_date,
                is_serviced: "Servicing"
            },
            { where: { srf_item_id: ids, rstatus: 1 } }
        );

        let items = await Item.findAll({
            where: { lab_id: labId, rstatus: 1 },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 201,
            message: `SRF Items Dispatch Information Updated Successfully`,
            items: items
        });

    } catch (err) {
        console.log(err);
        action = "Internal Server Error!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const updateSentWithoutCalibrationDate = async (req, res, next) => {

    if (!req.body.labId || !req.body.items || !req.body.srfId || !req.body.sent_without_calibration_date) {
        const error = new Error("All Fiels are required.");
        error.code = 400;
        return errorHandler(error, req, res, next);
    }

    let ids = [];
    req.body.items.map((v, i) => {
        ids.push(v.srf_item_id);
    });
    // return res.json(ids);

    const { labId, sent_without_calibration_date } = req.body;

    try {
        await Item.update(
            {
                status: "Sent Without Calibration",
                sent_without_calibration_date,
                is_serviced: "Sent Without Calibration"
            },
            { where: { srf_item_id: ids, rstatus: 1 } }
        );

        let items = await Item.findAll({
            where: { lab_id: labId, rstatus: 1 },
            include: ["intrument_type"],
            order: [["srf_item_id", "ASC"]]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 201,
            message: `SRF Items Dispatch Information Updated Successfully`,
            items: items
        });

    } catch (err) {
        console.log(err);
        action = "Internal Server Error!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const updateCalibrationStatus = async (req, res, next) => {

    if (
        !req.body.lab_id || !req.body.items || !req.body.srf_id || !req.body.mode
        || !req.body.calibrationDoneDate || !req.body.calibration_done_by_empname
    ) {
        const error = new Error("All Fiels are required.");
        error.code = 400;
        return errorHandler(error, req, res, next);
    }

    const { lab_id, srf_id, mode, calibration_done_by_empname, calibrationDoneDate, report_done_date } = req.body;

    let ids = [];
    req?.body?.items?.map((v, i) => {
        ids?.push(v.srf_item_id);
    });

    if (mode === 1) {
        await Item.update(
            {
                calibration_done_date: calibrationDoneDate,
                calibration_done_by_empname: calibration_done_by_empname,
                status: "Calibrated",
            },
            { where: { srf_item_id: ids, rstatus: 1 } }
        );
    }
    if (mode === 2) {
        await Item.update(
            {
                calibration_done_date: calibrationDoneDate,
                calibration_done_by_empname: calibration_done_by_empname,
                report_done_date: report_done_date,
                report_done_by_empname: calibration_done_by_empname,
                status: "Report Generated",
            },
            { where: { srf_item_id: ids, rstatus: 1 } }
        );
    }

    // TODO: calculate calibration_due_date = calibration_done_date + frequency_in_months [calculate in srf-items table]
    try {
        // *** frequency_in_months from srf_item table ***
        let srfItemResult = await Item.findOne({
            attributes: ['reminder_frequency'],
            where: { srf_item_id: ids, rstatus: 1 }
        });

        let { reminder_frequency } = srfItemResult;

        if (reminder_frequency == null || reminder_frequency == "") {
            reminder_frequency = 0
        }

        let calibration_due_date;

        if ((mode == 1 || mode == 3) && reminder_frequency != 0) {
            const calibration_done_date = new Date(calibrationDoneDate);
            calibration_due_date = new Date(calibration_done_date.setMonth(calibration_done_date.getMonth() + parseInt(reminder_frequency)));
        }

        await Item.update(
            { calibration_due_date },
            { where: { srf_item_id: ids, rstatus: 1 } }
        )
    } catch (err) {
        console.log(err);
        const error = new Error("Failed to Update calibration due date !!!");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    // ! SET Calibration Reaminder Dates
    // TODO: Formula calibration_remainder_date = calibration_due_date - frequency_days [calculate in srf-items table]

    // *** Getting calibration_due_date and frequency_days from srfitems table ***
    let srfItemResult = await Item.findAll({
        where: { srf_item_id: ids, rstatus: 1 },
        attributes: ['srf_item_id', 'calibration_due_date', 'frequency_days']
    });

    let createResponse = "";
    let calibration_remainder_date_1;
    let calibration_remainder_date_2;

    for (let i = 0; i < srfItemResult.length; i++) {

        const { calibration_due_date, frequency_days } = srfItemResult[i];

        if (frequency_days == 1 && calibration_due_date) {

            let due_date_1 = new Date(calibration_due_date);
            let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 7);
            calibration_remainder_date_1 = new Date(diffDateInMS_1);

            await srfItemResult[i].update({
                calibration_remainder_date_1
            });

            createResponse = "1 remainder";

        } else if (frequency_days == 2 && calibration_due_date) {

            let due_date_1 = new Date(calibration_due_date);
            let diffDateInMS_1 = due_date_1.setDate(due_date_1.getDate() - 15);
            calibration_remainder_date_1 = new Date(diffDateInMS_1);

            let due_date_2 = new Date(calibration_due_date);
            let diffDateInMS_2 = due_date_2.setDate(due_date_2.getDate() - 7);
            calibration_remainder_date_2 = new Date(diffDateInMS_2);

            await srfItemResult[i].update({
                calibration_remainder_date_1,
                calibration_remainder_date_2
            });

            createResponse = "2 remainder";
        }
    }

    let items = await Item.findAll({
        where: { lab_id: lab_id, rstatus: 1 },
        include: ["intrument_type"],
        order: [["srf_item_id", "ASC"]]
    });

    return res.status(200).json({
        status: "SUCCESS",
        code: 201,
        message: `SRF Items Updated Successfully`,
        items: items
    });
}

const updateReportGenerationStatus = async (req, res, next) => {

    if (!req.body.lab_id || !req.body.items || !req.body.report_done_by_empname || !req.body.report_done_date) {
        const error = new Error("All Fiels are required.");
        error.code = 400;
        return errorHandler(error, req, res, next);
    }

    const { lab_id, mode, report_done_by_empname, report_done_date } = req.body;

    let ids = [];
    req?.body?.items?.map((v, i) => {
        ids?.push(v.srf_item_id);
    });

    await Item.update(
        {
            report_done_date: report_done_date,
            report_done_by_empname: report_done_by_empname,
            status: "Report Generated",
        },
        { where: { srf_item_id: ids, rstatus: 1 } }
    );

    let items = await Item.findAll({
        where: { lab_id: lab_id, rstatus: 1 },
        include: ["intrument_type"],
        order: [["srf_item_id", "ASC"]]
    });

    return res.status(200).json({
        status: "SUCCESS",
        code: 201,
        message: `SRF Items Updated Successfully`,
        items: items
    });
}

exports.updateServiceDoneDate = updateServiceDoneDate;
exports.updateSentWithoutCalibrationDate = updateSentWithoutCalibrationDate;
exports.updateCalibrationStatus = updateCalibrationStatus;
exports.updateReportGenerationStatus = updateReportGenerationStatus;