const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approval-controller");
const checkAuth = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

router.use(checkAuth);

// Submit Review or Authorization action
router.post("/action", approvalController.submitAction);

// Get tasks for the current stage (REVIEW or AUTH)
router.get("/pending", approvalController.getPendingTasks);

// Get summary counts for the dashboard
router.get("/summary", approvalController.getSummary);

// Get detailed records for dashboard counts
router.get("/details", approvalController.getApprovalDetails);

module.exports = router;
