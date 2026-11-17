// routes/dashboard.js
const express = require("express");
const router = express.Router();
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const DashboardController = require("../controllers/Dashboard-controller");

router.post("/data", Authorization, checkPermission("ACCESS_DASHBOARD"), DashboardController.getDashboardData);
router.post("/line-chart-data", Authorization, checkPermission("ACCESS_DASHBOARD"), DashboardController.ChartData);
module.exports = router;
