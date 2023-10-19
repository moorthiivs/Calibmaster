const express = require("express");

const Authorization = require("../middleware/check-auth");

const router = express.Router();

const calibrationDateController = require("../controllers/srf-items-calibration-reaminder-date-controller");

router.post("/edit-calibration-due-date", Authorization, calibrationDateController.editCalibrationDueDate);
router.post("/calculate-calibration-reminder-date", Authorization, calibrationDateController.calculateCalibrationReminderDate);

module.exports = router;