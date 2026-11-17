const fs = require('fs');
const nodePath = require('path');
const { Op } = require("sequelize");
const SRF = require("../models").srf_list;
const Item = require("../models").srfitem;
const MasterResultTable = require("../models").master_result_table;
const Certificate = require("../models").Certificate;
const ResultTable = require("../models").result_table;
const SRFApprovalHistory = require("../models").srf_approval_history;
const { ProcedureResult } = require('../models');
const CalibmasterExcel = require('../models').CalibmasterExcel;
const MasterTable = require('../models').master_design_procedure;
const checkDiskSpace = require("check-disk-space").default;
const { syncSequencesForLab } = require("../utils/syncSequences");

const { customer: Customer, User, Lab } = require("../models");

const instrument = require("../models").instrument;

const instrumentTypeModel = require("../models").instrument_type;

// function getFolderSize(folderPath) {
//     try {
//         let totalSize = 0;
//         function calculateSize(dir) {
//             const files = fs.readdirSync(dir);
//             files.forEach((file) => {
//                 const filePath = nodePath.join(dir, file);
//                 const stats = fs.statSync(filePath);
//                 if (stats.isFile()) {
//                     totalSize += stats.size;
//                 } else if (stats.isDirectory()) {
//                     calculateSize(filePath);
//                 }
//             });
//         }

//         calculateSize(folderPath);
//         return totalSize;
//     } catch (error) {

//         console.log(error);

//     }

// }


function getFolderSize(folderPath) {
    let totalSize = 0;

    function calculateSize(dir) {
        let files;
        try {
            files = fs.readdirSync(dir);
        } catch {
            return; // inaccessible folder
        }

        files.forEach((file) => {
            if (file === "node_modules") return; // skip heavy symlinked folders

            const filePath = nodePath.join(dir, file);
            let stats;

            try {
                stats = fs.lstatSync(filePath);
            } catch {
                return;
            }

            if (stats.isSymbolicLink()) return; // avoid infinite loops

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
        const { Op } = require('sequelize');

        const srfCount = await SRF.count({ where: { rstatus: 0 } });
        const srfItemsCount = await Item.count({ where: { rstatus: 0 } });
        const excelCount = await CalibmasterExcel.count({ where: { is_deleted: true } });

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

        // Fetch soft-deleted Excel files
        const excelData = await CalibmasterExcel.findAll({
            where: { is_deleted: true },
            attributes: ['cmeid', 'FileName', 'labid', 'master_design_procedure_id', 'deletedby', 'deleted_at', 'createdAt'],
            include: [
                {
                    model: MasterTable,
                    attributes: ['calibration_procedure'],
                    required: false,
                    include: ['instrument_type']
                }
            ],
            order: [['deleted_at', 'DESC']]
        });

        const finalExcelData = excelData.map(e => ({
            cmeid: e.cmeid,
            fileName: e.FileName,
            labid: e.labid,
            procedure: e.master_design_procedure?.calibration_procedure || null,
            instrument: e.master_design_procedure?.instrument_type?.instrument_full_name || null,
            deletedAt: e.deleted_at,
            deletedby: e.deletedby,
        }));


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
                excel: excelCount,
            },
            data: {
                srf: groupedData,
                srfItems: finalItemData,
                excel: finalExcelData,
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
    const t = await SRF.sequelize.transaction();
    try {
        const { srf_item_id, lab_id } = req.body;

        let targetLabId = lab_id;
        if (!targetLabId) {
            const item = await Item.findOne({ where: { srf_item_id }, transaction: t });
            if (item) targetLabId = item.lab_id;
        }

        // 1. Delete physical certificate files from disk
        const certificates = await Certificate.findAll({
            where: { srfitemId: srf_item_id },
            transaction: t
        });

        for (const cert of certificates) {
            if (cert.fileName) {
                const certPath = nodePath.join(__dirname, "../certificates", cert.fileName);
                if (fs.existsSync(certPath)) {
                    try { fs.unlinkSync(certPath); } catch (e) { console.error("[CLEANUP] Error unlinking cert:", e); }
                }
            }
            if (cert.observationFileName) {
                const obsPath = nodePath.join(__dirname, "../certificates/Observation", cert.observationFileName);
                if (fs.existsSync(obsPath)) {
                    try { fs.unlinkSync(obsPath); } catch (e) { console.error("[CLEANUP] Error unlinking obs:", e); }
                }
            }
            if (cert.draftFileName) {
                const draftPath = nodePath.join(__dirname, "../certificates/Draft", cert.draftFileName);
                if (fs.existsSync(draftPath)) {
                    try { fs.unlinkSync(draftPath); } catch (e) { console.error("[CLEANUP] Error unlinking draft:", e); }
                }
            }
        }

        // 2. Delete Certificates records (resolves foreign key)
        await Certificate.destroy({ where: { srfitemId: srf_item_id }, transaction: t });

        // 3. Delete result_tables and master_result_tables
        const masterResults = await MasterResultTable.findAll({
            where: { srf_item_id },
            attributes: ["master_result_table_id"],
            transaction: t
        });
        if (masterResults && masterResults.length > 0) {
            const masterResultIds = masterResults.map(m => m.master_result_table_id);
            if (ResultTable) {
                await ResultTable.destroy({ where: { master_result_table_id: masterResultIds }, transaction: t });
            }
            await MasterResultTable.destroy({ where: { master_result_table_id: masterResultIds }, transaction: t });
        }

        // 4. Delete approval history
        if (SRFApprovalHistory) {
            await SRFApprovalHistory.destroy({ where: { srf_item_id }, transaction: t });
        }

        // 5. Delete procedure results
        if (ProcedureResult) {
            await ProcedureResult.destroy({ where: { srf_item_id }, transaction: t });
        }

        // 6. Delete srfitem
        await Item.destroy({ where: { srf_item_id }, transaction: t });

        await t.commit();

        // --- Update/Sync Sequences ---
        if (targetLabId) {
            try {
                await syncSequencesForLab(targetLabId);
            } catch (seqErr) {
                console.error("[DESTROY_ITEM] Sequence sync failed:", seqErr);
            }
        }

        return res.status(200).json({
            status: "SUCCESS",
            message: "SRF Item, related records & files deleted permanently",
        });
    } catch (err) {
        await t.rollback();
        console.error("[DESTROY_ITEM] Error:", err);
        return res.status(500).json({ status: "ERROR", message: "Delete failed", details: err.message });
    }
};

// *** Hard Delete Entire SRF ***
const destroySRF = async (req, res, next) => {
    const t = await SRF.sequelize.transaction();
    try {
        const { srf_id, lab_id } = req.body;

        let targetLabId = lab_id;
        if (!targetLabId) {
            const srf = await SRF.findOne({ where: { srf_id }, transaction: t });
            if (srf) targetLabId = srf.lab_id;
        }

        // 🔹 Get all SRF Items for this SRF
        const srfItems = await Item.findAll({
            where: { srf_id },
            attributes: ["srf_item_id"],
            transaction: t
        });
        const itemIds = srfItems.map(it => it.srf_item_id);

        if (itemIds.length > 0) {
            // 1. Find related certificates (to remove physical files)
            const certificates = await Certificate.findAll({
                where: { srfitemId: itemIds },
                transaction: t
            });

            for (const cert of certificates) {
                if (cert.fileName) {
                    const certPath = nodePath.join(__dirname, "../certificates", cert.fileName);
                    if (fs.existsSync(certPath)) {
                        try { fs.unlinkSync(certPath); } catch (e) { console.error("[CLEANUP] Error unlinking cert:", e); }
                    }
                }
                if (cert.observationFileName) {
                    const obsPath = nodePath.join(__dirname, "../certificates/Observation", cert.observationFileName);
                    if (fs.existsSync(obsPath)) {
                        try { fs.unlinkSync(obsPath); } catch (e) { console.error("[CLEANUP] Error unlinking obs:", e); }
                    }
                }
                if (cert.draftFileName) {
                    const draftPath = nodePath.join(__dirname, "../certificates/Draft", cert.draftFileName);
                    if (fs.existsSync(draftPath)) {
                        try { fs.unlinkSync(draftPath); } catch (e) { console.error("[CLEANUP] Error unlinking draft:", e); }
                    }
                }
            }

            // 2. Delete Certificates records
            await Certificate.destroy({ where: { srfitemId: itemIds }, transaction: t });

            // 3. Delete result_tables and master_result_tables
            const masterResults = await MasterResultTable.findAll({
                where: { srf_item_id: itemIds },
                attributes: ["master_result_table_id"],
                transaction: t
            });
            if (masterResults && masterResults.length > 0) {
                const masterResultIds = masterResults.map(m => m.master_result_table_id);
                if (ResultTable) {
                    await ResultTable.destroy({ where: { master_result_table_id: masterResultIds }, transaction: t });
                }
                await MasterResultTable.destroy({ where: { master_result_table_id: masterResultIds }, transaction: t });
            }

            // 4. Delete approval history
            if (SRFApprovalHistory) {
                await SRFApprovalHistory.destroy({ where: { srf_item_id: itemIds }, transaction: t });
            }

            // 5. Delete procedure results
            if (ProcedureResult) {
                await ProcedureResult.destroy({ where: { srf_item_id: itemIds }, transaction: t });
            }

            // 6. Delete all items
            await Item.destroy({ where: { srf_id }, transaction: t });
        }

        // Clean up any remaining master_result_tables referencing srf_id directly
        const leftoverMaster = await MasterResultTable.findAll({
            where: { srf_id },
            attributes: ["master_result_table_id"],
            transaction: t
        });
        if (leftoverMaster && leftoverMaster.length > 0) {
            const mIds = leftoverMaster.map(m => m.master_result_table_id);
            if (ResultTable) {
                await ResultTable.destroy({ where: { master_result_table_id: mIds }, transaction: t });
            }
            await MasterResultTable.destroy({ where: { master_result_table_id: mIds }, transaction: t });
        }

        // Clean up any ProcedureResult referencing srf_id directly
        if (ProcedureResult) {
            await ProcedureResult.destroy({ where: { srf_id }, transaction: t });
        }

        // 🔹 Delete SRF itself
        await SRF.destroy({ where: { srf_id }, transaction: t });

        await t.commit();

        // --- Update/Sync Sequences ---
        if (targetLabId) {
            try {
                await syncSequencesForLab(targetLabId);
            } catch (seqErr) {
                console.error("[DESTROY_SRF] Sequence sync failed:", seqErr);
            }
        }

        return res.status(200).json({
            status: "SUCCESS",
            message: "SRF, related items, certificates, observation files & records deleted permanently",
        });
    } catch (err) {
        await t.rollback();
        console.error("[DESTROY_SRF] Error:", err);
        return res.status(500).json({ status: "ERROR", message: "Delete failed", details: err.message });
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
