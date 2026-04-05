const { EmployeeTracking } = require("../models");
const moment = require("moment-timezone");
const fs = require('fs');
const { Op } = require("sequelize");

const autoLogout = async () => {
    try {
        const { EmployeeTracking, sequelize } = require("../models");
        const { Op } = require("sequelize");

        // Find latest event for each user
        const latestEvents = await EmployeeTracking.findAll({
            attributes: [
                "userId",
                [sequelize.fn("MAX", sequelize.col("empTrackingId")), "latestId"]
            ],
            group: ["userId"]
        });

        const latestIds = latestEvents.map(e => e.dataValues.latestId);

        // Filter those whose latest event is "LOGIN"
        const activeSessions = await EmployeeTracking.findAll({
            where: {
                empTrackingId: { [Op.in]: latestIds },
                status: "LOGIN"
            }
        });

        let count = 0;
        const logoutAt = new Date();

        for (let track of activeSessions) {
            const duration = moment.duration(moment(logoutAt).diff(moment(track.loginAt)));
            const totalHours = Math.max(0, parseFloat(duration.asHours().toFixed(2)));

            // UPDATE the existing LOGIN record in-place
            await track.update({
                logoutAt: logoutAt,
                status: "LOGOUT",
                logoutType: "AUTO",
                totalHours: totalHours
            });

            // Create a new LOGIN record for the new day so their active session continues seamlessly
            await EmployeeTracking.create({
                userId: track.userId,
                loginAt: logoutAt,
                date: moment(logoutAt).format("YYYY-MM-DD"),
                status: "LOGIN",
                ipAddress: track.ipAddress || "SYSTEM_ROLLOVER"
            });
            count++;
        }

        const currentDateInIST = new Date().toLocaleString("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        let data = `Cron Job: Auto logout processed at ${currentDateInIST}. Total users logged out: ${count}\n`;
        fs.appendFile("cronLogger.txt", data, function (err) {
            if (err) throw err;
        });

    } catch (err) {
        console.error('Error during auto-logout cron job:', err);
    }
};

const heartbeatLogout = async () => {
    try {
        const { EmployeeTracking, EmployeeTrackConfig, sequelize } = require("../models");
        const { Op } = require("sequelize");

        // Fetch configured idle timeout
        const config = await EmployeeTrackConfig.findOne();
        // Give a generous buffer over the idle timeout (e.g. idle timeout + 5 mins).
        // If a browser background tab heavily throttles the 90s heartbeat ping, this stops
        // the session from being prematurely killed. Normal idle logouts happen via the frontend at exactly idleTimeoutMinutes.
        const maxAgeMinutes = (config && config.idleTimeoutMinutes ? config.idleTimeoutMinutes : 20) + 5;
        const limitTimeAgo = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

        // Find latest event for each user
        const latestEvents = await EmployeeTracking.findAll({
            attributes: [
                "userId",
                [sequelize.fn("MAX", sequelize.col("empTrackingId")), "latestId"]
            ],
            group: ["userId"]
        });

        const latestIds = latestEvents.map(e => e.dataValues.latestId);

        const activeSessions = await EmployeeTracking.findAll({
            where: {
                empTrackingId: { [Op.in]: latestIds },
                status: "LOGIN",
                updatedAt: { [Op.lt]: limitTimeAgo }
            }
        });

        let count = 0;
        const logoutAt = new Date();

        for (let track of activeSessions) {
            const duration = moment.duration(moment(logoutAt).diff(moment(track.loginAt)));
            let totalHours = parseFloat(duration.asHours().toFixed(2));
            if (totalHours < 0) totalHours = 0;

            // UPDATE the existing LOGIN record in-place
            await track.update({
                logoutAt: logoutAt,
                status: "LOGOUT",
                logoutType: "INACTIVE",
                totalHours: totalHours
            });
            count++;
        }

        if (count > 0) {
            console.log(`Heartbeat cron: Logged out ${count} inactive users (BROWSER_CLOSE).`);
        }

    } catch (err) {
        console.error('Error during heartbeat logout cron job:', err);
    }
};

module.exports = {
    autoLogout,
    heartbeatLogout
};
