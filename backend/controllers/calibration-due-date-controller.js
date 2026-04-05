const Item = require("../models").srfitem;
const instrumentType = require("../models").instrument_type;
const { Op, literal, Sequelize } = require('sequelize');
const { errorHandler } = require("../helpers/error-handler");

const GetDueDateCount = async (req, res, next) => {
    const { labId, selectedYear } = req.body;

    if (!labId || !selectedYear) {
        const error = new Error("lab Detail are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
    try {

        const query = await Item.findAll({
            where: {
                lab_id: labId,
                rstatus: 1,
                [Op.and]: [
                    literal(`EXTRACT(YEAR FROM calibration_due_date) = ${selectedYear}`)
                ]
            }
        });

        const items = query.reduce((acc, { dataValues: { calibration_due_date } }) => {
            if (!calibration_due_date) return acc; // Skip if there's no date
            const date = calibration_due_date.toISOString().split("T")[0];
            const existing = acc.find(entry => entry.due_date === date);

            if (existing) {
                existing.due_date_count += 1;
            } else {
                acc.push({ due_date: date, due_date_count: 1 });
            }

            return acc;
        }, []);

        return res.status(200).send({ success: true, status: 200, msg: "Items count successfully fetched!", items });

    } catch (err) {
        console.log(err);
        let action = "Something went wrong while getting Items";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/due_date/get-calibration-due-date";
        return errorHandler(error, req, res, next);
    }
}


const CalibrationDuedateItems = async (req, res, next) => {
    const { labId, date } = req.body;

    
    if (!labId || !date) {
        const error = new Error("lab Detail are required");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
    try {
        const query = await Item.findAll({
            where: {
                lab_id: labId,
                rstatus: 1,
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('DATE', Sequelize.col('calibration_due_date')), date)
                ]
            }
        });


        const items = await Promise.all(query.map(async ({ dataValues }) => {
            const { intrument_type_id, make, model, serial_no, calibration_due_date, calibration_done_date } = dataValues;

            try {
                const instrumentTypeData = await instrumentType.findOne({
                    where: { instrument_type_id: intrument_type_id, lab_id: labId },
                })
                return {
                    description: instrumentTypeData?.dataValues?.instrument_full_name,
                    make: make || '--',
                    model: model || '--',
                    serial_no,
                    calibration_due_date,
                    last_calibration_date: calibration_done_date
                };
            } catch (error) {
                console.error(`Error fetching Instrument type details for ${intrument_type_id}:`, error);
                return null;
            }
        }));

        return res
            .status(200)
            .send({ success: true, status: 200, msg: "Items successfully fetched!", items: items.filter(item => item) });

    } catch (err) {
        console.log(err);
        let action = "Something went wrong while getting Items";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/due_date/calibration-due-date-items";
        return errorHandler(error, req, res, next);
    }
}

exports.CalibrationDuedateItems = CalibrationDuedateItems;
exports.GetDueDateCount = GetDueDateCount;
