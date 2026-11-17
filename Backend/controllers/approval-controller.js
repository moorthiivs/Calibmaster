const db = require("../models");
const Item = db.srfitem;
const MasterTable = db.master_result_table;
const History = db.srf_approval_history;
const Certificate = db.Certificate;
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { generate } = require("./Generate-Certificate-Controller");
const { checkIsOverTolerance } = require("../utils/pdfUtils");
exports.submitAction = async (req, res) => {
    const { srf_item_id, stage, action, comments, date } = req.body;
    const userId = req.userId;

    try {
        const item = await Item.findOne({ where: { srf_item_id } });
        if (!item) return res.status(404).json({ code: 404, message: "SRF Item not found" });

        const master = await MasterTable.findOne({ where: { srf_item_id } });
        if (!master) return res.status(404).json({ code: 404, message: "Result table entry not found" });

        let nextStatus = item.status;
        let updateData = {};

        if (stage === 'REVIEW') {
            if (action === 'APPROVE') {
                nextStatus = 'Auth Pending';
                updateData = {
                    approved_user_id: userId
                };
            } else if (action === 'REJECT') {
                nextStatus = 'Calibrated';
            }
        } else if (stage === 'AUTH') {
            if (action === 'APPROVE') {
                nextStatus = 'Auth Approved';
                updateData = {
                    authorizedby_user_id: userId
                };
            } else if (action === 'REJECT') {
                nextStatus = 'Review Pending';
            }
        }

        // 1. Update Master Table Metadata FIRST (so signatures are available for PDF generation)
        if (Object.keys(updateData).length > 0) {
            await master.update(updateData);
        }

        // 2. Automatically generate certificate IF approved
        if (action === 'APPROVE') {
            try {
                const mockReq = {
                    body: {
                        lab_id: item.lab_id,
                        srf_id: item.srf_id,
                        srf_item_id,
                        reportGenerateDate: date || new Date(),
                        calibrationDate: item.calibration_done_date,
                        skip_response: true,
                        itemstatus: nextStatus === "Auth Approved"
                    },
                    userId: userId
                };
                // Mock res and next
                const mockRes = { set: () => { }, send: () => { } };
                const mockNext = (err) => { if (err) throw err; };

                await generate(mockReq, mockRes, mockNext);
            } catch (genError) {
                console.error("Certificate Generation failed during approval:", genError);
                return res.status(500).json({ code: 500, message: "Certificate generation failed: " + genError.message });
            }
        }

        // 3. Update SRF Item Status LAST (only after successful generation)
        await item.update({ status: nextStatus });

        // Log History
        await History.create({
            srf_item_id,
            stage_type: stage,
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            acted_by: userId,
            acted_at: date || new Date(), // Use provided date
            comments: comments || ""
        });

        res.status(200).json({
            code: 200,
            message: `Stage ${stage} ${action}ED successfully`,
            nextStatus
        });

    } catch (error) {
        console.error("Approval Action Error:", error);
        res.status(500).json({ code: 500, message: error.message });
    }
};

exports.getPendingTasks = async (req, res) => {
    const {
        stage,
        page = 1,
        limit = 20,
        search = "",
        sortBy = "srf_item_id",
        sortOrder = "DESC",
        labId,
        lab_id
    } = req.query;

    let targetStatus = stage === 'REVIEW' ? 'Review Pending' : 'Auth Pending';
    const currentLabId = labId || lab_id;

    try {
        let parsedPage = parseInt(page, 10);
        if (isNaN(parsedPage) || parsedPage < 1) parsedPage = 1;

        let parsedLimit = parseInt(limit, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 20;
        const allowedLimits = [5, 10, 20, 50, 100];
        if (!allowedLimits.includes(parsedLimit)) {
            parsedLimit = parsedLimit > 100 ? 100 : (allowedLimits.find(l => l >= parsedLimit) || 20);
        }

        const offset = (parsedPage - 1) * parsedLimit;

        const allowedSortFields = ["srf_item_id", "srf_item_no", "serial_no", "status", "calibration_done_date", "calibration_due_date", "created_timestamp"];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "srf_item_id";
        const safeSortOrder = (sortOrder && String(sortOrder).toUpperCase() === "ASC") ? "ASC" : "DESC";

        const whereClause = { status: targetStatus, rstatus: 1 };
        if (currentLabId) {
            whereClause.lab_id = currentLabId;
        }

        if (search && String(search).trim() !== "") {
            const searchPattern = `%${String(search).trim()}%`;
            whereClause[Op.and] = [
                {
                    [Op.or]: [
                        { serial_no: { [Op.iLike]: searchPattern } },
                        { identification_details: { [Op.iLike]: searchPattern } },
                        { make: { [Op.iLike]: searchPattern } },
                        { model: { [Op.iLike]: searchPattern } },
                        { status: { [Op.iLike]: searchPattern } },
                        { inward_no: { [Op.iLike]: searchPattern } },
                        { '$intrument_type.instrument_full_name$': { [Op.iLike]: searchPattern } },
                        { '$srf.srf_number$': { [Op.iLike]: searchPattern } }
                    ]
                }
            ];
        }

        const includeClause = [
            {
                association: 'srf',
                include: [{ association: 'customer' }]
            },
            { association: 'intrument_type' }
        ];

        const count = await Item.count({
            where: whereClause,
            include: includeClause,
            distinct: true,
            col: 'srf_item_id'
        });

        const tasks = await Item.findAll({
            where: whereClause,
            include: includeClause,
            order: [[safeSortBy, safeSortOrder]],
            limit: parsedLimit,
            offset: offset
        });

        // Bulk-fetch latest certificate per srf_item_id (avoids N+1)
        const ids = tasks.map(t => t.srf_item_id);
        const certs = ids.length > 0 ? await Certificate.findAll({
            where: { srfitemId: ids },
            attributes: ['srfitemId', 'fileName', 'observationFileName'],
            order: [['createdAt', 'DESC']]
        }) : [];

        // Keep only the most-recent cert per item
        const certMap = {};
        for (const c of certs) {
            if (!certMap[c.srfitemId]) certMap[c.srfitemId] = c;
        }

        // Bulk-fetch ProcedureResults to check for over-tolerance
        const results = ids.length > 0 ? await db.ProcedureResult.findAll({
            where: { srf_item_id: ids },
            attributes: ['srf_item_id', 'ExcelData', 'Styles']
        }) : [];

        const resultMap = {};
        for (const r of results) {
            resultMap[r.srf_item_id] = r;
        }

        const enriched = tasks.map(t => {
            const c = certMap[t.srf_item_id];
            const r = resultMap[t.srf_item_id];
            let isOverTolerance = false;
            if (r) {
                isOverTolerance = checkIsOverTolerance(r.ExcelData, r.Styles);
            }

            return {
                ...t.toJSON(),
                isOverTolerance,
                certificate: {
                    hasCertificate: !!(c?.fileName),
                    hasObservation: !!(c?.observationFileName),
                    certCount: [c?.fileName, c?.observationFileName].filter(Boolean).length
                }
            };
        });

        res.status(200).json({
            code: 200,
            data: enriched,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / parsedLimit),
                currentPage: parsedPage,
                limit: parsedLimit
            }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
};
exports.getSummary = async (req, res) => {
    try {
        const userId = req.userId;

        const reviewPending = await Item.count({ where: { status: 'Review Pending', rstatus: 1 } });
        const authPending = await Item.count({ where: { status: 'Auth Pending', rstatus: 1 } });
        const reportGenerated = await Item.count({ where: { status: 'Report Generated', rstatus: 1 } });

        // Items approved by THIS user in Review Stage
        const reviewApprovedByUser = await History.count({
            where: {
                stage_type: 'REVIEW',
                status: 'APPROVED',
                acted_by: userId
            },
            distinct: true,
            col: 'srf_item_id'
        });

        // Items approved by THIS user in Auth Stage
        const authApprovedByUser = await History.count({
            where: {
                stage_type: 'AUTH',
                status: 'APPROVED',
                acted_by: userId
            },
            distinct: true,
            col: 'srf_item_id'
        });

        res.status(200).json({
            code: 200,
            data: {
                reviewPending,
                authPending,
                authApproved: await Item.count({ where: { status: 'Auth Approved', rstatus: 1 } }),
                reportGenerated,
                reviewApprovedByUser,
                authApprovedByUser
            }
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: error.message });
    }
};

exports.getApprovalDetails = async (req, res) => {
    const { type } = req.query; // 'REVIEW_APPROVED' or 'AUTH_APPROVED'
    const userId = req.userId;

    try {
        // First, find all srf_item_ids this user has approved in this stage
        const histories = await History.findAll({
            attributes: ['srf_item_id', 'comments', 'stage_type', 'acted_at'],
            where: {
                stage_type: type === 'REVIEW_APPROVED' ? 'REVIEW' : 'AUTH',
                status: 'APPROVED',
                acted_by: userId
            },
            order: [['acted_at', 'DESC'], ['id', 'DESC']]
        });

        if (!histories.length) {
            return res.status(200).json({ code: 200, data: [] });
        }

        const itemIds = [...new Set(histories.map(h => h.srf_item_id))];

        const details = await Item.findAll({
            where: { srf_item_id: itemIds, rstatus: 1 },
            include: [
                {
                    model: db.srf_list,
                    as: 'srf',
                    include: [{ model: db.customer, as: 'customer' }]
                },
                { model: db.instrument_type, as: 'intrument_type' }
            ],
            order: [["srf_item_id", "DESC"]],
        });

        // Map items by ID for quick lookup
        const itemMap = {};
        details.forEach(item => {
            itemMap[item.srf_item_id] = item.toJSON();
        });

        // Bulk-fetch latest certificate per srf_item_id
        const certs = itemIds.length > 0 ? await Certificate.findAll({
            where: { srfitemId: itemIds },
            attributes: ['srfitemId', 'fileName', 'observationFileName'],
            order: [['srfitemId', 'DESC']]
        }) : [];

        const certMap = {};
        for (const c of certs) {
            if (!certMap[c.srfitemId]) certMap[c.srfitemId] = c;
        }

        // Bulk-fetch ProcedureResults to check for over-tolerance
        const results = itemIds.length > 0 ? await db.ProcedureResult.findAll({
            where: { srf_item_id: itemIds },
            attributes: ['srf_item_id', 'ExcelData', 'Styles']
        }) : [];

        const resultMap = {};
        for (const r of results) {
            resultMap[r.srf_item_id] = r;
        }

        // Build enriched result keeping the history sort order and details
        const enriched = histories.map(history => {
            const item = itemMap[history.srf_item_id];
            if (!item) return null;
            const c = certMap[history.srf_item_id];
            const r = resultMap[history.srf_item_id];
            let isOverTolerance = false;
            if (r) {
                isOverTolerance = checkIsOverTolerance(r.ExcelData, r.Styles);
            }
            return {
                ...item,
                dynamic_date: history.acted_at,
                dynamic_comments: history.comments || '-',
                isOverTolerance,
                certificate: {
                    hasCertificate: !!(c?.fileName),
                    hasObservation: !!(c?.observationFileName),
                    certCount: [c?.fileName, c?.observationFileName].filter(Boolean).length
                }
            };
        }).filter(Boolean);

        res.status(200).json({ code: 200, data: enriched });
    } catch (error) {
        console.error("Get Approval Details Error:", error);
        res.status(500).json({ code: 500, message: error.message });
    }
};
