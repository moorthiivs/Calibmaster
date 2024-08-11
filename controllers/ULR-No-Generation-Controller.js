const ULRSetup = require("../models").ULRGeneration;
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const { errorHandler } = require("../helpers/error-handler");

const setDate = new Date();

const create = async (req, res, next) => {

    try {

        let monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        let {
            lab_id,
            accreditationNumber, currentYear, location, accreditedScope,
            effectiveStartDateString, effectiveEndDateString
        } = req.body;

        let formattedStartDateString = "";
        let formattedEndDateString = "";

        if (effectiveStartDateString) {
            let inputDateStringStartDate = effectiveStartDateString;
            let inputStartDate = new Date(inputDateStringStartDate);
            let Startyear = inputStartDate.getFullYear();
            let Startmonth = monthNames[inputStartDate.getMonth()];
            let Startday = inputStartDate.getDate();
            formattedStartDateString = Startday + "-" + Startmonth + "-" + Startyear;
        }

        if (effectiveEndDateString) {
            let inputDateStringEndDate = effectiveEndDateString;
            let inputEndDate = new Date(inputDateStringEndDate);
            let Endyear = inputEndDate.getFullYear();
            let Endmonth = monthNames[inputEndDate.getMonth()];
            let Endday = inputEndDate.getDate();
            formattedEndDateString = Endday + "-" + Endmonth + "-" + Endyear;
        }

        const effectiveStartDate = formattedStartDateString || `01-Jan-${currentYear}`;
        const effectiveEndDate = formattedEndDateString || `31-Dec-${currentYear}`;

        const isDataExist = await ULRSetup.update({
            accreditationNumber: accreditationNumber,
            currentYear: currentYear,
            location: location,
            accreditedScope: accreditedScope,
            effectiveStartDate,
            effectiveEndDate,
        }, { where: { currentYear: currentYear, effectiveFlag: "Y" } });

        if (isDataExist[0] == 0) {
            await ULRSetup.create({
                lab_id,
                accreditationNumber,
                currentYear,
                location,
                runningNumber: "00000001",
                accreditedScope,
                effectiveStartDate,
                effectiveEndDate,
                effectiveFlag: "Y",
            });
        }

        const newData = await ULRSetup.findAll({
            where: {
                currentYear: currentYear,
                effectiveFlag: "Y"
            }
        });

        return res.status(200).json(newData);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}

const fetchULR = async (req, res, next) => {

    try {
        const { lab_id } = req.params;

        const data = await ULRSetup.findAll({
            where: {
                lab_id,
            }
        });

        return res.status(200).json({ msg: 'Fetched all ULR successful;y', data });
    } catch (err) {
        console.log(err);
        let action = "Something went wrong";
        const error = new Error(action);
        error.code = 500;
        error.path = "fetch-ulr";
        return errorHandler(error, req, res, next);
    }
}

const ulrSetUp = async (req, res, next) => {

    try {

        const { lab_id } = req.params;

        const currentYear = setDate.getFullYear() % 100;

        const retrievedData = await ULRSetup.findOne({
            where: {
                lab_id,
                currentYear: currentYear - 1
            }
        });

        const currentYearData = await ULRSetup.findOne({
            where: {
                lab_id,
                currentYear: currentYear,
                effectiveFlag: "Y"
            }
        });

        return res.status(200).json({ prevYearData: retrievedData, currentYearData: currentYearData });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}

const getUlr = async (req, res, next) => {

    try {
        let currenteffectiveFlag = "";
        let ulrNumber = "";
        let ulrArray = [];
        let latestRunningNumber = undefined;

        const { lab_id, accreditationNumber, currentYear, location, ulrcount } = req.body;

        const accreditationDetail = await ULRSetup.findOne({
            where: {
                lab_id,
                accreditationNumber,
                currentYear: currentYear,
                effectiveFlag: "Y"
            },
        });

        if (accreditationDetail) {
            let initialRunningNumber = +accreditationDetail.runningNumber;

            let updatedCurrentRunningNumber = initialRunningNumber;

            for (let i = 1; i <= ulrcount; i++) {
                updatedCurrentRunningNumber = updatedCurrentRunningNumber + 1;
            }

            updatedCurrentRunningNumber = updatedCurrentRunningNumber.toString().padStart(8, '0');
            latestRunningNumber = updatedCurrentRunningNumber;

            await accreditationDetail.update({
                runningNumber: updatedCurrentRunningNumber,
            });

            const ulrQuery = await ULRSetup.findOne({
                where: {
                    lab_id,
                    accreditationNumber,
                    currentYear: currentYear,
                },
            });
            currenteffectiveFlag = ulrQuery.effectiveFlag;

            for (let i = initialRunningNumber + 1; i <= updatedCurrentRunningNumber; i++) {
                ulrNumber = "";
                let result = i.toString().padStart(8, '0');

                ulrNumber = ulrQuery.accreditationNumber + (currentYear) + location + result + ulrQuery.accreditedScope;
                ulrArray.push(ulrNumber);
            }
        }
        return res
            .status(200)
            .json({
                Status: "updated", ULRNumber: ulrArray,
                Flag: currenteffectiveFlag, currentRunningNumber: latestRunningNumber
            });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}

const nextYearUlr = async (req, res, next) => {

    try {

        const {
            lab_id,
            accreditationNumber, currentYear, location, runningNumber, accreditedScope,
            effectiveStartDateString, effectiveEndDateString
        } = req.body;

        const thisYear = setDate.getFullYear() % 100 + 1;

        await ULRSetup.update(
            { effectiveFlag: 'N' },
            { where: { lab_id, currentYear: thisYear - 1 } }
        );

        const newData = await ULRSetup.create({
            lab_id,
            accreditationNumber,
            currentYear,
            location,
            runningNumber: "00000000",
            accreditedScope,
            effectiveStartDate: effectiveStartDateString,
            effectiveEndDate: effectiveEndDateString,
            effectiveFlag: "Y",
        });

        return res.status(201).json(newData);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}

const generateULRNumber = async (ulrcount, lab_id) => {

    try {
        let currenteffectiveFlag = "";
        let ulrNumber = "";
        let ulrArray = [];
        let latestRunningNumber = undefined;

        const this_Year = setDate.getFullYear() % 100;

        const accreditationDetail = await ULRSetup.findOne({
            where: {
                lab_id,
                currentYear: this_Year
            }
        });
        const { currentYear, location } = accreditationDetail

        if (accreditationDetail) {

            let initialRunningNumber = +accreditationDetail.runningNumber;

            let updatedCurrentRunningNumber = initialRunningNumber;

            for (let i = 1; i <= ulrcount; i++) {
                updatedCurrentRunningNumber = updatedCurrentRunningNumber + 1;
            }

            updatedCurrentRunningNumber = updatedCurrentRunningNumber?.toString()?.padStart(8, '0');
            latestRunningNumber = updatedCurrentRunningNumber;

            await accreditationDetail.update({
                lab_id,
                runningNumber: updatedCurrentRunningNumber,
            });

            const ulrQuery = await ULRSetup.findOne({
                where: { lab_id, currentYear: currentYear },
            });
            currenteffectiveFlag = ulrQuery.effectiveFlag;

            for (let i = initialRunningNumber + 1; i <= updatedCurrentRunningNumber; i++) {
                ulrNumber = "";
                let result = i.toString().padStart(8, '0');

                ulrNumber = ulrQuery.accreditationNumber + (currentYear) + location + result + ulrQuery.accreditedScope;
                ulrArray.push(ulrNumber);
            }
        }
        return ulrArray;
    } catch (err) {
        console.log(err);
    }
}

const updateULRNumber = async (req, res, next) => {

    const { items, lab_id } = req.body;

    let idCollections = [];

    items?.map((v, i) => {
        idCollections.push(v.srf_item_id);
    });

    const ulr_numbers = await generateULRNumber(items.length, lab_id);

    const query = await Item.findAll({
        where: { srf_item_id: idCollections }
    });

    for (let i = 0; i < query.length; i++) {
        query[i].url_number = ulr_numbers[i];

        await Item.update({ url_number: ulr_numbers[i] }, {
            where: {
                srf_item_id: query[i].srf_item_id,
                rstatus: 1,
            },
        });
    }

    return res.json(ulr_numbers);
}

exports.create = create;
exports.fetchULR = fetchULR;
exports.ulrSetUp = ulrSetUp;
exports.getUlr = getUlr;
exports.nextYearUlr = nextYearUlr;
exports.updateULRNumber = updateULRNumber;