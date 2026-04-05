const DisciplineModel = require("../models").instrument_discipline;
const { errorHandler } = require("../helpers/error-handler");

const ListDiscipline = async (req, res, next) => {

    try {
        let DisciplineList = await DisciplineModel.findAll({
            order: [
                ['instrument_discipline_id', 'DESC'],
            ]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Discipline List Fetched Successfully!!",
            data: DisciplineList
        });

    } catch (err) {

        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

exports.ListDiscipline = ListDiscipline;