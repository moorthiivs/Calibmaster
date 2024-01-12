const express = require("express");

const Authorization = require("../middleware/check-auth");

const router = express.Router();

const calibrationDateController = require("../controllers/srf-items-calibration-reaminder-date-controller");

// ! Test API
router.post("/edit-calibration-due-date", Authorization, calibrationDateController.editCalibrationDueDate);

// ! Test API
router.post("/calculate-calibration-reminder-date", Authorization, calibrationDateController.calculateCalibrationReminderDate);

router.post("/edit-calibration-reminder-date", Authorization, calibrationDateController.updateCalibrationReminderDate);

module.exports = router;