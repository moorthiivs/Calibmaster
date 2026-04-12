const express = require("express");
const router = express.Router();
const employeeTrackController = require("../controllers/employee-track-controller");
const Authorization = require("../middleware/check-auth");
const labController = require("../controllers/lab-controller");

router.post("/login", Authorization, employeeTrackController.loginTrack);
router.post("/logout", Authorization, employeeTrackController.logoutTrack);
router.post("/verify-session", Authorization, employeeTrackController.verifySession);
router.post("/intent-logout", employeeTrackController.intentToLogout);
router.post("/heartbeat-ping", Authorization, employeeTrackController.heartbeatPing);
router.get("/labs", labController.getAllLabs);
router.post("/daily-report", employeeTrackController.getDailyReport);
router.post("/filtered-report", employeeTrackController.getFilteredReport);
router.post("/monthly-report", employeeTrackController.getMonthlyReport);
router.post("/dashboard-stats", employeeTrackController.getDashboardStats);
router.post("/active-employees", employeeTrackController.getActiveEmployees);
router.post("/user-stats", employeeTrackController.getUserStats);
router.post("/get-settings", employeeTrackController.getSettings);
router.post("/update-settings", employeeTrackController.updateSettings);
router.post("/admin-manual-logout", employeeTrackController.adminManualLogout);

module.exports = router;
