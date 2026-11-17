const express = require("express");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const srfStatusController = require("../controllers/srf-status-controller");

const router = express.Router();

router.post("/dispatch", Authorization, checkPermission(["UPDATE_RESULT", "EDIT_SRF"]), srfStatusController.updateDispatchDetails);

router.post("/report-dispatch", Authorization, checkPermission(["UPDATE_RESULT", "EDIT_SRF"]), srfStatusController.updateReportDispatchDetails);

router.post("/payment", Authorization, checkPermission(["UPDATE_RESULT", "EDIT_SRF"]), srfStatusController.updatePaymentDetails);

module.exports = router;