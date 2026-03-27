const { EmployeeTracking, User, sequelize, EmployeeTrackConfig } = require("../models");
const { errorHandler } = require("../helpers/error-handler");
const { Op } = require("sequelize");
const moment = require("moment-timezone");
const logger = require("../utils/logger");

const loginTrack = async (req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const { userId } = req.body;

    try {
        const timeZone = "Asia/Kolkata";
        const loginAt = moment().tz(timeZone).toDate();
        const date = moment().tz(timeZone).format("YYYY-MM-DD");

        const [config] = await EmployeeTrackConfig.findOrCreate({
            where: {},
            defaults: { idleTimeoutMinutes: 20, preventConcurrentLogins: false }
        });

        if (config.preventConcurrentLogins) {
            const lastSessionRecord = await EmployeeTracking.findOne({
                where: { userId },
                order: [["empTrackingId", "DESC"]]
            });

            if (lastSessionRecord && lastSessionRecord.status !== "LOGOUT") {
                // Check if the open session is stale (older than 2× idle timeout).
                // This handles sleep-mode scenarios where the frontend fired a logout but
                // the backend never received it due to the network not being up yet.
                const staleThresholdMs = (config.idleTimeoutMinutes || 20) * 2 * 60 * 1000;
                const sessionAgeMs = Date.now() - new Date(lastSessionRecord.updatedAt).getTime();

                if (sessionAgeMs > staleThresholdMs) {
                    // Auto-close the stale session so the new login can proceed
                    const staleLogoutAt = new Date();
                    const duration = moment.duration(moment(staleLogoutAt).diff(moment(lastSessionRecord.loginAt)));
                    const totalHours = Math.max(0, parseFloat(duration.asHours().toFixed(2)));
                    await lastSessionRecord.update({
                        logoutAt: staleLogoutAt,
                        status: "LOGOUT",
                        logoutType: "STALE",
                        totalHours
                    });
                    logger.info(`User ${userId} - Stale session #${lastSessionRecord.empTrackingId} auto-closed on new login.`);
                } else {
                    // Session is genuinely active — block concurrent login
                    return res.status(403).json({
                        status: "ERROR",
                        message: "You are already logged in on another device. Please logout there first."
                    });
                }
            }
        }

        const newTrack = await EmployeeTracking.create({
            userId,
            loginAt,
            date,
            status: "LOGIN",
            ipAddress: ip
        });

        logger.info(`User ${userId} - LOGIN event recorded from ${ip}`);
        res.status(201).json({ status: "SUCCESS", message: "Login event recorded", data: newTrack });
    } catch (err) {
        console.error(err);
        const error = new Error("Failed to record login event");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const logoutTrack = async (req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const { userId, logoutType } = req.body;

    try {
        const timeZone = "Asia/Kolkata";
        const logoutAt = moment().tz(timeZone).toDate();

        // Find the most recent open LOGIN record for this user
        const lastLogin = await EmployeeTracking.findOne({
            where: { userId, status: "LOGIN" },
            order: [["empTrackingId", "DESC"]]
        });

        if (!lastLogin) {
            // No open session found — nothing to close
            logger.warn(`User ${userId} - LOGOUT called but no open LOGIN session found.`);
            return res.status(200).json({ status: "SUCCESS", message: "No active session to close." });
        }

        const duration = moment.duration(moment(logoutAt).diff(moment(lastLogin.loginAt)));
        const totalHours = Math.max(0, parseFloat(duration.asHours().toFixed(2)));

        // UPDATE the existing LOGIN record in-place instead of creating a new record
        await lastLogin.update({
            logoutAt: logoutAt,
            status: "LOGOUT",
            logoutType: logoutType || "MANUAL",
            totalHours: totalHours
        });

        logger.info(`User ${userId} - LOGIN record #${lastLogin.empTrackingId} updated to LOGOUT (${logoutType || "MANUAL"})`);
        res.status(200).json({ status: "SUCCESS", message: "Logout event recorded", data: lastLogin });
    } catch (err) {
        console.error(err);
        const error = new Error("Failed to record logout event");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const pendingLogouts = new Map();

const verifySession = async (req, res, next) => {
    const userIdStr = String(req.body.userId);
    const { userId } = req.body;
    try {
        if (!userId) return res.status(400).json({ status: "ERROR" });

        // If they just refreshed, cancel the 7-second browser close timer!
        if (pendingLogouts.has(userIdStr)) {
            clearTimeout(pendingLogouts.get(userIdStr));
            pendingLogouts.delete(userIdStr);
            logger.info(`User ${userId} BROWSER_CLOSE cancelled due to page reload.`);
            return res.status(200).json({ status: "SUCCESS", valid: true });
        }

        const latestSession = await EmployeeTracking.findOne({
            where: { userId },
            order: [["empTrackingId", "DESC"]]
        });

        if (latestSession && latestSession.status === "LOGOUT") {
            // The backend historically shows them logged out. Their local JWT is stale.
            return res.status(200).json({ status: "SUCCESS", valid: false });
        }

        return res.status(200).json({ status: "SUCCESS", valid: true });
    } catch (err) {
        const error = new Error("Failed to verify session");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const intentToLogout = async (req, res) => {
    // Called strictly via sendBeacon on browser close or refresh
    const userIdStr = String(req.body.userId);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ status: "ERROR" });

    if (pendingLogouts.has(userIdStr)) clearTimeout(pendingLogouts.get(userIdStr));

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Start 7-second timer to completely ensure it's not a refresh
    const timeoutId = setTimeout(async () => {
        try {
            // Find the most recent open LOGIN for this user
            const latestSession = await EmployeeTracking.findOne({
                where: { userId, status: "LOGIN" },
                order: [["empTrackingId", "DESC"]]
            });

            if (latestSession) {
                const logoutAt = new Date();
                const duration = moment.duration(moment(logoutAt).diff(moment(latestSession.loginAt)));
                let totalHours = parseFloat(duration.asHours().toFixed(2));
                if (totalHours < 0) totalHours = 0;

                // UPDATE the existing LOGIN record in-place
                await latestSession.update({
                    logoutAt: logoutAt,
                    status: "LOGOUT",
                    logoutType: "BROWSER_CLOSE",
                    totalHours: totalHours
                });
                logger.info(`User ${userId} - LOGIN record #${latestSession.empTrackingId} updated to LOGOUT via BROWSER_CLOSE`);
            }
        } catch (e) {
            console.error("Intent logout error details:", e);
        } finally {
            pendingLogouts.delete(userIdStr);
        }
    }, 7000);

    pendingLogouts.set(userIdStr, timeoutId);
    return res.status(200).json({ status: "SUCCESS" });
};

const getDailyReport = async (req, res, next) => {
    const { date, labId, userId } = req.body; // Assuming filtering by date and lab

    try {
        const whereClause = {
            date: date || moment().tz("Asia/Kolkata").format("YYYY-MM-DD")
        };
        if (userId) whereClause.userId = userId;

        const reports = await EmployeeTracking.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: "User",
                where: labId ? { labId } : {},
                attributes: ["name", "email", "department"]
            }],
            order: [["empTrackingId", "DESC"]]
        });

        // Find the latest empTrackingId per user among today's records
        const latestIdByUser = {};
        for (const r of reports) {
            if (!latestIdByUser[r.userId] || r.empTrackingId > latestIdByUser[r.userId]) {
                latestIdByUser[r.userId] = r.empTrackingId;
            }
        }

        // Remove orphaned LOGIN records left over from the old dual-record architecture.
        // A LOGIN record is an orphan if it is NOT the latest record for that user
        // (meaning a newer LOGOUT record already exists, so this LOGIN was never updated).
        const cleanedReports = reports.filter(r => {
            if (r.status !== "LOGIN") return true; // always keep LOGOUT records
            return r.empTrackingId === latestIdByUser[r.userId]; // only keep a LOGIN if it is the latest event
        });

        res.status(200).json({ status: "SUCCESS", data: cleanedReports });
    } catch (err) {
        console.error(err);
        const error = new Error("Failed to fetch daily report");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const getMonthlyReport = async (req, res, next) => {
    const { month, year, userId, labId } = req.body;

    try {
        const startDate = moment([year, month - 1]).startOf("month").toDate();
        const endDate = moment([year, month - 1]).endOf("month").toDate();

        const whereClause = {
            loginAt: { [Op.between]: [startDate, endDate] }
        };
        if (userId) whereClause.userId = userId;

        const reports = await EmployeeTracking.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: "User",
                where: labId ? { labId } : {},
                attributes: ["name", "email", "department"]
            }],
            order: [["loginAt", "DESC"]]
        });

        res.status(200).json({ status: "SUCCESS", data: reports });
    } catch (err) {
        console.error(err);
        const error = new Error("Failed to fetch monthly report");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const getFilteredReport = async (req, res, next) => {
    const { startDate, endDate, labId, userId } = req.body;

    try {
        if (!startDate || !endDate) {
            return res.status(400).json({ status: "ERROR", message: "Start date and end date are required" });
        }

        const whereClause = {
            date: {
                [Op.between]: [startDate, endDate]
            }
        };

        if (userId) {
            whereClause.userId = userId;
        }

        const userWhereClause = {};
        if (labId) {
            userWhereClause.labId = labId;
        }

        const reports = await EmployeeTracking.findAll({
            where: whereClause,
            include: [{
                model: User,
                as: "User",
                where: userWhereClause,
                attributes: ["name", "email", "department"]
            }],
            order: [["loginAt", "DESC"]]
        });

        res.status(200).json({ status: "SUCCESS", data: reports });
    } catch (err) {
        console.error(err);
        const error = new Error("Failed to fetch filtered report");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const getDashboardStats = async (req, res, next) => {
    const { labId, date } = req.body;

    try {
        const queryDate = date || moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

        // Find the latest event for each user today
        const latestEvents = await EmployeeTracking.findAll({
            where: { date: queryDate },
            attributes: [
                "userId",
                [sequelize.fn("MAX", sequelize.col("empTrackingId")), "latestId"]
            ],
            group: ["userId"],
            raw: true
        });

        const latestIds = latestEvents.map(e => e.latestId).filter(id => id !== null);

        if (latestIds.length === 0) {
            return res.status(200).json({
                status: "SUCCESS",
                data: {
                    activeUsers: 0,
                    totalHoursToday: 0
                }
            });
        }

        // Count how many of those latest events are "LOGIN"
        const activeUsersCount = await EmployeeTracking.count({
            where: {
                empTrackingId: { [Op.in]: latestIds },
                status: "LOGIN"
            },
            include: [{
                model: User,
                as: "User",
                where: labId ? { labId } : {}
            }]
        });

        // Total hours worked today (sum of totalHours from all LOGOUT events today)
        const loggedOutHoursToday = await EmployeeTracking.sum("totalHours", {
            where: {
                date: queryDate,
                status: "LOGOUT"
            },
            include: [{
                model: User,
                as: "User",
                where: labId ? { labId } : {}
            }]
        });

        // Add real-time accrued hours from actively logged-in sessions today
        const activeSessions = await EmployeeTracking.findAll({
            where: {
                date: queryDate,
                status: "LOGIN"
            },
            include: [{
                model: User,
                as: "User",
                where: labId ? { labId } : {}
            }]
        });

        let activeAccruedHours = 0;
        const now = moment().tz("Asia/Kolkata").toDate();
        for (const session of activeSessions) {
            const duration = moment.duration(moment(now).diff(moment(session.loginAt)));
            let hrs = parseFloat(duration.asHours().toFixed(2));
            if (hrs > 0) activeAccruedHours += hrs;
        }

        const totalHoursToday = (loggedOutHoursToday || 0) + activeAccruedHours;

        res.status(200).json({
            status: "SUCCESS",
            data: {
                activeUsers: activeUsersCount,
                totalHoursToday: totalHoursToday || 0
            }
        });
    } catch (err) {
        console.error(err);
        const error = new Error("Failed to fetch dashboard stats");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const getActiveEmployees = async (req, res, next) => {
    const { labId, date } = req.body;

    try {
        const queryDate = date || moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

        // Find latest event for each user today
        const latestEvents = await EmployeeTracking.findAll({
            where: { date: queryDate },
            attributes: [
                "userId",
                [sequelize.fn("MAX", sequelize.col("empTrackingId")), "latestId"]
            ],
            group: ["userId"],
            raw: true
        });

        const latestIds = latestEvents.map(e => e.latestId).filter(id => id !== null);

        if (latestIds.length === 0) {
            return res.status(200).json({ status: "SUCCESS", data: [] });
        }

        // Get details of all users who had activity today
        const activityEmployees = await EmployeeTracking.findAll({
            where: {
                empTrackingId: { [Op.in]: latestIds }
            },
            include: [{
                model: User,
                as: "User",
                where: labId ? { labId } : {},
                attributes: ["id", "name", "email", "department"]
            }],
            order: [["loginAt", "DESC"]]
        });

        res.status(200).json({ status: "SUCCESS", data: activityEmployees });
    } catch (err) {
        console.error(err);
        const error = new Error("Failed to fetch active employees");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const getUserStats = async (req, res, next) => {
    const { userId, labId, date } = req.body;

    try {
        const queryDate = date || moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
        const monthStart = moment().tz("Asia/Kolkata").startOf("month").toDate();
        const monthEnd = moment().tz("Asia/Kolkata").endOf("month").toDate();

        // 1. Today's total logged-out hours
        const todayLoggedOutHours = await EmployeeTracking.sum("totalHours", {
            where: {
                userId,
                date: queryDate,
                status: "LOGOUT"
            }
        });

        // Add real-time accrued hours from active session today
        const activeSessionToday = await EmployeeTracking.findOne({
            where: { userId, date: queryDate, status: "LOGIN" },
            order: [["empTrackingId", "DESC"]]
        });

        let accruedToday = 0;
        const nowTime = moment().tz("Asia/Kolkata").toDate();
        if (activeSessionToday) {
            const duration = moment.duration(moment(nowTime).diff(moment(activeSessionToday.loginAt)));
            let hrs = parseFloat(duration.asHours().toFixed(2));
            if (hrs > 0) accruedToday = hrs;
        }

        const todayHours = (todayLoggedOutHours || 0) + accruedToday;

        // 2. Monthly total logged-out hours
        const monthlyLoggedOutHours = await EmployeeTracking.sum("totalHours", {
            where: {
                userId,
                status: "LOGOUT",
                loginAt: { [Op.between]: [monthStart, monthEnd] }
            }
        });

        // Add real-time accrued hours from active session this month
        let accruedMonthly = 0;
        const activeSessionMonthly = await EmployeeTracking.findOne({
            where: { userId, status: "LOGIN", loginAt: { [Op.between]: [monthStart, monthEnd] } },
            order: [["empTrackingId", "DESC"]]
        });
        if (activeSessionMonthly) {
            const duration = moment.duration(moment(nowTime).diff(moment(activeSessionMonthly.loginAt)));
            let hrs = parseFloat(duration.asHours().toFixed(2));
            if (hrs > 0) accruedMonthly = hrs;
        }

        const monthlyHours = (monthlyLoggedOutHours || 0) + accruedMonthly;

        // 3. User Detail
        const userDetail = await User.findOne({
            where: { id: userId },
            attributes: ["id", "name", "email", "department"]
        });

        res.status(200).json({
            status: "SUCCESS",
            data: {
                user: userDetail,
                todayHours: todayHours || 0,
                monthlyHours: monthlyHours || 0
            }
        });
    } catch (err) {
        console.error(err);
        const error = new Error("Failed to fetch user stats");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const getSettings = async (req, res, next) => {
    try {
        const [config] = await EmployeeTrackConfig.findOrCreate({
            where: {},
            defaults: { idleTimeoutMinutes: 20, preventConcurrentLogins: false }
        });
        return res.status(200).json({ status: "SUCCESS", data: config });
    } catch (err) {
        console.error("Error fetching settings:", err);
        const error = new Error("Failed to fetch settings");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const { idleTimeoutMinutes, preventConcurrentLogins } = req.body;

        let config = await EmployeeTrackConfig.findOne();
        if (!config) {
            config = await EmployeeTrackConfig.create({ idleTimeoutMinutes, preventConcurrentLogins });
        } else {
            config.idleTimeoutMinutes = idleTimeoutMinutes;
            config.preventConcurrentLogins = preventConcurrentLogins;
            await config.save();
        }

        return res.status(200).json({ status: "SUCCESS", message: "Settings updated successfully", data: config });
    } catch (err) {
        console.error("Error updating settings:", err);
        const error = new Error("Failed to update settings");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

const heartbeatPing = async (req, res, next) => {
    const { userId } = req.body;
    try {
        
        if (!userId) return res.status(400).json({ status: "ERROR" });

        // Find the latest open LOGIN session and touch its updatedAt.
        // The heartbeatLogout cron uses updatedAt to detect sessions that went silent.
        const activeSession = await EmployeeTracking.findOne({
            where: { userId, status: "LOGIN" },
            order: [["empTrackingId", "DESC"]]
        });

        if (activeSession) {
            // Direct update query bypasses Sequelize's "did fields change?" instance checks
            // and forces the DB row to update, bumping the updatedAt timestamp.
            await EmployeeTracking.update(
                { updatedAt: new Date() },
                { where: { empTrackingId: activeSession.empTrackingId } }
            );
        }

        return res.status(200).json({ status: "SUCCESS" });
    } catch (err) {
        console.error(err);
        const error = new Error("Heartbeat ping failed");
        error.code = 500;
        return errorHandler(error, req, res, next);
    }
};

exports.loginTrack = loginTrack;
exports.logoutTrack = logoutTrack;
exports.verifySession = verifySession;
exports.intentToLogout = intentToLogout;
exports.heartbeatPing = heartbeatPing;
exports.getDailyReport = getDailyReport;
exports.getMonthlyReport = getMonthlyReport;
exports.getFilteredReport = getFilteredReport;
exports.getDashboardStats = getDashboardStats;
exports.getActiveEmployees = getActiveEmployees;
exports.getUserStats = getUserStats;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
