const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const router = express.Router();

const calibrationDateController = require("../controllers/srf-items-calibration-reaminder-date-controller");

// All calibration date routes require LIST_SRF as the base permission
// (these are SRF item sub-operations — editing calibration due dates)
router.post("/edit-calibration-due-date", Authorization, checkPermission("EDIT_SRF"), calibrationDateController.editCalibrationDueDate);
router.post("/calculate-calibration-reminder-date", Authorization, checkPermission("LIST_SRF"), calibrationDateController.calculateCalibrationReminderDate);
router.post("/edit-calibration-reminder-date", Authorization, checkPermission("EDIT_SRF"), calibrationDateController.updateCalibrationReminderDate);

module.exports = router;