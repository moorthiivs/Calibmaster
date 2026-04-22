const express = require("express");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const BulkUpdateController = require("../controllers/Bulk-Update-Controller");

const router = express.Router();

router.post("/update-bulk-service-done-date", Authorization, checkPermission("EDIT_SRF"), BulkUpdateController.updateServiceDoneDate);
router.post("/update-bulk-sent-without-calibration-date", Authorization, checkPermission("EDIT_SRF"), BulkUpdateController.updateSentWithoutCalibrationDate);
router.post("/update-bulk-calibration-status", Authorization, checkPermission("EDIT_SRF"), BulkUpdateController.updateCalibrationStatus);
router.post("/update-bulk-report-generation-status", Authorization, checkPermission("EDIT_SRF"), BulkUpdateController.updateReportGenerationStatus);

module.exports = router;
