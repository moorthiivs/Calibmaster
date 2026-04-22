const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/Inward-Report-Controller");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

router.get("/report", Authorization, checkPermission("ACCESS_REPORTS"), ReportController.getInwardReport);

module.exports = router;
