// routes/dashboard.js
const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/Dashboard-controller");

router.post("/data", DashboardController.getDashboardData);
router.post("/line-chart-data", DashboardController.ChartData);
module.exports = router;
