
const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/Inward-Report-Controller");

router.get("/report", ReportController.getInwardReport);

module.exports = router;
