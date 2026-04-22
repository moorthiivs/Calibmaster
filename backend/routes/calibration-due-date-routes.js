const express = require("express");
const CalibrationDuedate = require("../controllers/calibration-due-date-controller");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const router = express.Router();

router.use(Authorization);
router.use(checkPermission("ACCESS_DUE_DATE"));

router.post("/get-calibration-due-date", CalibrationDuedate.GetDueDateCount);
router.post("/calibration-due-date-items", CalibrationDuedate.CalibrationDuedateItems);

module.exports = router;