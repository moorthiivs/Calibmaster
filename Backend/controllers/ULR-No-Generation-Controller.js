const ULRSetup = require("../models").ULRGeneration;
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const { sequelize, Sequelize } = require("../models");
const { errorHandler } = require("../helpers/error-handler");

// Note: Always use `new Date()` at call-time to get the current date.
// Do NOT cache date in a module-level variable — it becomes stale after server startup.

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

        return res.status(200).json({ msg: 'Fetched all ULR successfully', data });
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

        const currentYear = new Date().getFullYear() % 100;

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

    // Use a SERIALIZABLE transaction with row-level lock to prevent race conditions
    const t = await sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });

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
            lock: t.LOCK.UPDATE,
            transaction: t
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
            }, { transaction: t });

            currenteffectiveFlag = accreditationDetail.effectiveFlag;

            for (let i = initialRunningNumber + 1; i <= updatedCurrentRunningNumber; i++) {
                ulrNumber = "";
                let result = i.toString().padStart(8, '0');

                ulrNumber = accreditationDetail.accreditationNumber + (currentYear) + location + result + accreditationDetail.accreditedScope;
                ulrArray.push(ulrNumber);
            }
        }

        await t.commit();

        console.log(`[ULR-AUDIT] getUlr | lab_id=${lab_id} | count=${ulrcount} | assigned=${ulrArray.join(',')}`);

        return res
            .status(200)
            .json({
                Status: "updated", ULRNumber: ulrArray,
                Flag: currenteffectiveFlag, currentRunningNumber: latestRunningNumber
            });
    } catch (err) {
        await t.rollback();
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

        const thisYear = new Date().getFullYear() % 100 + 1;

        await ULRSetup.update(
            { effectiveFlag: 'N' },
            { where: { lab_id, currentYear: thisYear - 1 } }
        );

        const ifExist = await ULRSetup.findOne({
            where: {
                lab_id,
                currentYear: currentYear
            }
        });

        if (ifExist) {
            const updateData = await ULRSetup.update(
                {
                    accreditationNumber,
                    location,
                    accreditedScope,
                    effectiveStartDate: effectiveStartDateString,
                    effectiveEndDate: effectiveEndDateString,
                    effectiveFlag: "Y",
                },
                { where: { lab_id, currentYear: currentYear } }
            );
            return res.status(201).json(updateData);
        }

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

    // Use a SERIALIZABLE transaction with row-level lock to prevent race conditions
    const t = await sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    });

    try {
        let ulrNumber = "";
        let ulrArray = [];

        // Always use current date at call-time (not cached server-startup date)
        const this_Year = new Date().getFullYear() % 100;

        const accreditationDetail = await ULRSetup.findOne({
            where: {
                lab_id,
                currentYear: this_Year
            },
            lock: t.LOCK.UPDATE,
            transaction: t
        });

        // If no ULR config found for the current year, block the operation
        if (!accreditationDetail) {
            await t.rollback();
            const err = new Error(
                `ULR configuration not found for the year 20${this_Year}. Please set up ULR for the current year before adding items.`
            );
            err.code = 400;
            err.isUlrMissing = true;
            throw err;
        }

        const { currentYear, location } = accreditationDetail;

        let initialRunningNumber = +accreditationDetail.runningNumber;

        let updatedCurrentRunningNumber = initialRunningNumber;

        for (let i = 1; i <= ulrcount; i++) {
            updatedCurrentRunningNumber = updatedCurrentRunningNumber + 1;
        }

        updatedCurrentRunningNumber = updatedCurrentRunningNumber?.toString()?.padStart(8, '0');

        await accreditationDetail.update({
            lab_id,
            runningNumber: updatedCurrentRunningNumber,
        }, { transaction: t });

        for (let i = initialRunningNumber + 1; i <= updatedCurrentRunningNumber; i++) {
            ulrNumber = "";
            let result = i.toString().padStart(8, '0');

            ulrNumber = accreditationDetail.accreditationNumber + (currentYear) + location + result + accreditationDetail.accreditedScope;
            ulrArray.push(ulrNumber);
        }

        await t.commit();

        console.log(`[ULR-AUDIT] generateULRNumber | lab_id=${lab_id} | count=${ulrcount} | assigned=${ulrArray.join(',')}`);

        return ulrArray;
    } catch (err) {
        // Only rollback if transaction is still active (not already rolled back above)
        if (!err.isUlrMissing) {
            await t.rollback();
        }
        console.log(err);
        throw err;
    }
}

const updateULRNumber = async (req, res, next) => {
    try {

        const { items, lab_id } = req.body;

        let idCollections = [];

        items?.map((v, i) => {
            idCollections.push(v.srf_item_id);
        });

        const query = await Item.findAll({
            where: { srf_item_id: idCollections, rstatus: 1 }
        });

        // Filter: ONLY items that are NABL AND do NOT already have a url_number
        const itemsNeedingUlr = query.filter(it => 
            !it.url_number && (it.labtype || "").trim().toUpperCase() === "NABL"
        );

        if (itemsNeedingUlr.length > 0) {
            const ulr_numbers = await generateULRNumber(itemsNeedingUlr.length, lab_id);

            for (let i = 0; i < itemsNeedingUlr.length; i++) {
                itemsNeedingUlr[i].url_number = ulr_numbers[i];

                await Item.update({ url_number: ulr_numbers[i] }, {
                    where: {
                        srf_item_id: itemsNeedingUlr[i].srf_item_id,
                        rstatus: 1,
                    },
                });
            }
        }

        const updatedItems = await Item.findAll({
            where: { srf_item_id: idCollections }
        });
        const resultUlrs = updatedItems.map(it => it.url_number);

        return res.status(200).json(resultUlrs);
    }
    catch (err) {
        console.log(err);
        // Return 400 with clear message if ULR config is missing for current year
        if (err.isUlrMissing) {
            return res.status(400).json({ error: err.message, isUlrMissing: true });
        }
        return res.status(500).json({ error: err.message || "Internal Server Error" });
    }
}

exports.create = create;
exports.fetchULR = fetchULR;
exports.ulrSetUp = ulrSetUp;
exports.getUlr = getUlr;
exports.nextYearUlr = nextYearUlr;
exports.generateULRNumber = generateULRNumber;
exports.updateULRNumber = updateULRNumber;