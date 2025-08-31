const fs = require('fs');
const nodePath = require('path');
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const MasterResultTable = require("../models").master_result_table;
const Certificate = require("../models").Certificate;
const { ProcedureResult } = require('../models');
const checkDiskSpace = require("check-disk-space").default;

const { customer: Customer, User, Lab } = require("../models");

const instrument = require("../models").instrument;

const instrumentTypeModel = require("../models").instrument_type;

function getFolderSize(folderPath) {
    let totalSize = 0;

    function calculateSize(dir) {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
            const filePath = nodePath.join(dir, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                calculateSize(filePath);
            }
        });
    }

    calculateSize(folderPath);
    return totalSize;
}

function formatSize(bytes) {
    if (bytes >= 1024 ** 3) return (bytes / (1024 ** 3)).toFixed(2) + " GB";
    if (bytes >= 1024 ** 2) return (bytes / (1024 ** 2)).toFixed(2) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
    return bytes + " B";
}

const diskUsageData = async (req, res, next) => {
    try {
        const projectPath = nodePath.resolve(__dirname, "..");
        const diskSpace = await checkDiskSpace(projectPath);

        const freeGB = (diskSpace.free / (1024 ** 3)).toFixed(2) + " GB";
        const totalGB = (diskSpace.size / (1024 ** 3)).toFixed(2) + " GB";
        const usedGB = ((diskSpace.size - diskSpace.free) / (1024 ** 3)).toFixed(2) + " GB";
        const usedPercent = (((diskSpace.size - diskSpace.free) / diskSpace.size) * 100).toFixed(2) + " %";

        const projectSizeBytes = getFolderSize(projectPath);
        const projectSize = formatSize(projectSizeBytes);

        res.json({
            path: diskSpace.path,
            totalGB,
            freeGB,
            usedGB,
            usedPercent,
            projectPath,
            projectSizeBytes,
            projectSize
        });
    } catch (err) {
        console.error("Unable to get disk space: " + err.message);
        res.status(500).json({ error: "Unable to get disk space", details: err.message });
    }
}



const deletedstats = async (req, res, next) => {
    try {

        const srfCount = await SRF.count({ where: { rstatus: 0 } });
        const srfItemsCount = await Item.count({ where: { rstatus: 0 } });

        const srfData = await SRF.findAll({
            where: { rstatus: 0 },
            attributes: ["srf_id", "srf_number", "srf_date", "updated_timestamp", "deletedby_id", "lab_id"],
            include: [
                {
                    model: Customer,
                    as: "customer",
                    attributes: ["customer_id", "customer_name"],
                },
                {
                    model: User,
                    as: "deletedByUser",
                    attributes: ["id", "name"],
                },

                {
                    model: Lab,
                    as: "lab",
                    attributes: ["lab_id", "lab_name"],
                }
            ],
            order: [["updated_timestamp", "DESC"]],
        });

        const srfItemsData = await Item.findAll({
            where: { rstatus: 0 },
            attributes: ["srf_item_id", "srf_id", "updated_timestamp", "deletedby_id", "lab_id"],
            include: [
                {
                    model: SRF,
                    as: "srf",
                    attributes: ["srf_id", "srf_number"],
                    include: [
                        {
                            model: Customer,
                            as: "customer",
                            attributes: ["customer_id", "customer_name"],
                        },
                    ],
                },
                {
                    model: instrumentTypeModel,
                    as: "intrument_type",
                    include: [
                        {
                            model: instrument,
                            as: "instrument",
                            attributes: ["instrument_name"],
                        },
                    ],
                },
                {
                    model: User,
                    as: "deletedByUser",
                    attributes: ["id", "name"],
                },
                {
                    model: Lab,
                    as: "lab",
                    attributes: ["lab_id", "lab_name"],
                }
            ],
            order: [["updated_timestamp", "DESC"]],
        });


        const finalSrfData = srfData.map((s) => ({
            srf_id: s.srf_id,
            srf_number: s.srf_number,
            srf_date: s.srf_date,
            deletedDate: s.updated_timestamp,
            deletedBy: s.deletedByUser ? s.deletedByUser.name : null,
            customer_name: s.customer?.customer_name || null,
            lab_name: s.lab.lab_name || null,
            lab_id: s.lab.lab_id || null
        }));


        const finalItemData = srfItemsData.map((i) => ({
            srf_item_id: i.srf_item_id,
            srf_id: i.srf_id,
            srf_number: i.srf?.srf_number || null,
            deletedDate: i.updated_timestamp,
            deletedBy: i.deletedByUser ? i.deletedByUser.name : null,
            customer_name: i.srf?.customer?.customer_name || null,
            instrument_name: i.intrument_type?.instrument?.instrument_name || null,
            lab_name: i.lab.lab_name || null,
            lab_id: i.lab.lab_id || null
        }));


        const groupedData = finalSrfData.map((srf) => ({
            ...srf,
            items: finalItemData.filter((item) => Number(item.srf_id) === Number(srf.srf_id)),
        }));

        res.json({
            stats: {
                srf: srfCount,
                srfItems: srfItemsCount,
            },
            data: {
                srf: groupedData,
                srfItems: finalItemData,
            },
        });
    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch deleted stats",
            details: err.message,
        });
    }
};





// *** Hard Delete SRF Items ***
const destroySRFItem = async (req, res, next) => {
    try {
        const { srf_item_id, lab_id } = req.body;

        const certificates = await Certificate.findAll({
            where: { srfitemId: srf_item_id }
        });

        for (const cert of certificates) {
            if (cert.fileName) {
                const certPath = nodePath.join(__dirname, "../certificates", cert.fileName);
                if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
            }
            if (cert.observationFileName) {
                const obsPath = nodePath.join(__dirname, "../certificates/Observation", cert.observationFileName);
                if (fs.existsSync(obsPath)) fs.unlinkSync(obsPath);
            }
        }

        // --- Delete related DB records ---
        await MasterResultTable.destroy({ where: { srf_item_id, lab_id } });
        await Certificate.destroy({ where: { srfitemId: srf_item_id } });
        await ProcedureResult.destroy({ where: { srf_item_id, labid: lab_id } });
        await Item.destroy({ where: { srf_item_id } });

        return res.status(200).json({
            status: "SUCCESS",
            message: "SRF Item, related records & files deleted permanently",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "ERROR", message: "Delete failed" });
    }
};

// *** Hard Delete Entire SRF ***
const destroySRF = async (req, res, next) => {
    try {
        const { srf_id, lab_id } = req.body;

        // 🔹 Get all SRF Items for this SRF
        const srfItems = await Item.findAll({ where: { srf_id } });

        for (const srfItem of srfItems) {
            // --- Find related certificates (to remove files) ---
            const certificates = await Certificate.findAll({
                where: { srfitemId: srfItem.srf_item_id }
            });

            for (const cert of certificates) {

                // Certificate file
                if (cert.fileName) {
                    const certPath = nodePath.join(__dirname, "../certificates", cert.fileName);
                    if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
                }
                // Observation file
                if (cert.observationFileName) {
                    const obsPath = nodePath.join(__dirname, "../certificates/Observation", cert.observationFileName);
                    if (fs.existsSync(obsPath)) fs.unlinkSync(obsPath);
                }
            }

            // Delete child records per item
            await MasterResultTable.destroy({ where: { srf_item_id: srfItem.srf_item_id, lab_id } });
            await Certificate.destroy({ where: { srfitemId: srfItem.srf_item_id } });
            await ProcedureResult.destroy({ where: { srf_item_id: srfItem.srf_item_id, labid: lab_id } });
        }

        // 🔹 Delete all items
        await Item.destroy({ where: { srf_id } });

        // 🔹 Delete SRF itself
        await SRF.destroy({ where: { srf_id, lab_id } });

        return res.status(200).json({
            status: "SUCCESS",
            message: "SRF, related items, certificates, observation files & records deleted permanently",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "ERROR", message: "Delete failed" });
    }
};


const RestoreSRF = async (req, res, next) => {
    if (!req.body || !req.body.srf_id) {
        return res.status(400).json({
            status: "FAILED",
            code: 400,
            message: "Missing required field: srf_id",
        });
    }

    const { srf_id } = req.body;

    try {
        await Item.update(
            { rstatus: 1, updated_timestamp: new Date() },
            { where: { srf_id } }
        );

        await SRF.update(
            { rstatus: 1, updated_timestamp: new Date() },
            { where: { srf_id } }
        );

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "SRF and related items restored successfully",
            data: { srf_id },
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: "FAILED",
            code: 500,
            message: "Failed to restore SRF and related items",
            details: err.message,
        });
    }
};

const RestoreSRFItem = async (req, res, next) => {
    if (!req.body || !req.body.srf_item_id) {
        return res.status(400).json({
            status: "FAILED",
            code: 400,
            message: "Missing required field: srf_item_id",
        });
    }

    const { srf_item_id } = req.body;

    try {
        const item = await Item.findOne({ where: { srf_item_id } });


        if (!item) {
            return res.status(404).json({
                status: "FAILED",
                code: 404,
                message: "SRF Item not found",
            });
        }

        await item.update({
            rstatus: 1,
            updated_timestamp: new Date(),

        });

        return res.status(200).json({
            status: "SUCCESS",
            code: 200,
            message: "SRF Item restored successfully",
            data: { srf_item_id },
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: "FAILED",
            code: 500,
            message: "Failed to restore SRF Item",
            details: err.message,
        });
    }
};




exports.diskUsageData = diskUsageData
exports.deletedstats = deletedstats
exports.destroySRFItem = destroySRFItem
exports.destroySRF = destroySRF

exports.RestoreSRF = RestoreSRF
exports.RestoreSRFItem = RestoreSRFItem
