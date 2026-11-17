const express = require("express");
const router = express.Router();
const userTrackController = require("../controllers/user-track-controller");
const Authorization = require("../middleware/check-auth");
const labController = require("../controllers/lab-controller");

router.post("/login", Authorization, userTrackController.loginTrack);
router.post("/logout", Authorization, userTrackController.logoutTrack);
router.post("/verify-session", Authorization, userTrackController.verifySession);
router.post("/intent-logout", userTrackController.intentToLogout);
router.post("/heartbeat-ping", Authorization, userTrackController.heartbeatPing);
router.get("/labs", labController.getAllLabs);
router.post("/daily-report", userTrackController.getDailyReport);
router.post("/filtered-report", userTrackController.getFilteredReport);
router.post("/monthly-report", userTrackController.getMonthlyReport);
router.post("/dashboard-stats", userTrackController.getDashboardStats);
router.post("/active-users", userTrackController.getActiveUsers);
router.post("/user-stats", userTrackController.getUserStats);
router.post("/get-settings", userTrackController.getSettings);
router.post("/update-settings", userTrackController.updateSettings);
router.post("/admin-manual-logout", userTrackController.adminManualLogout);

module.exports = router;
