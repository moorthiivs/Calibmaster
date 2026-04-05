const express = require("express");

const BulkUpdateController = require("../controllers/Bulk-Update-Controller");

const router = express.Router();

router.post("/update-bulk-service-done-date", BulkUpdateController.updateServiceDoneDate);

router.post("/update-bulk-sent-without-calibration-date", BulkUpdateController.updateSentWithoutCalibrationDate);

router.post("/update-bulk-calibration-status", BulkUpdateController.updateCalibrationStatus);

router.post("/update-bulk-report-generation-status", BulkUpdateController.updateReportGenerationStatus);

module.exports = router;
