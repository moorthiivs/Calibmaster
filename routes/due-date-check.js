const express = require("express");

const CalibrationDuedate = require("../controllers/calibration-due-date-check");

const router = express.Router();

router.post("/get-calibration-due-date", CalibrationDuedate.GetDueDateCount);

router.post("/calibration-due-date-items", CalibrationDuedate.CalibrationDuedateItems);

module.exports = router;