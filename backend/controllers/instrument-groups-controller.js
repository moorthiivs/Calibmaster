const GroupsModel = require("../models").instrument_groups;
const { errorHandler } = require("../helpers/error-handler");

const ListInstrumentGroups = async (req, res, next) => {

    try {
        let GroupsModelList = await GroupsModel.findAll({
            include: ["discipline"],
            order: [
                ['instrument_group_id', 'DESC']
            ]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Group List Fetched Successfully!!",
            data: GroupsModelList
        });

    } catch (err) {

        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

const FindInstrumentGroups = async (req, res, next) => {

    try {

        const id = req.params.id;

        if (!id) {
            let action = "Group id is required";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        let GroupsList = await GroupsModel.findAll({
            where: { instrument_discipline_id: id },
            include: ["discipline"],
            order: [
                ['instrument_group_id', 'DESC']
            ]
        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "Group List Fetched Successfully!!",
            data: GroupsList
        });

    } catch (err) {

        let action = "Internal Server Error!!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
}

exports.ListInstrumentGroups = ListInstrumentGroups;
exports.FindInstrumentGroups = FindInstrumentGroups;