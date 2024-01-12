const express = require("express");

const srfStatusController = require("../controllers/srf-status-controller");

const router = express.Router();

router.post("/dispatch", srfStatusController.updateDispatchDetails);

router.post("/report-dispatch", srfStatusController.updateReportDispatchDetails);

router.post("/payment", srfStatusController.updatePaymentDetails);

module.exports = router;