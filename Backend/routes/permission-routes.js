const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permission-controller");
const Authorization = require("../middleware/check-auth");

/**
 * @route   GET /api/permissions/schema
 * @desc    Fetch the hierarchical permission groups for Role creation UI
 * @access  Private
 */
router.get("/schema", Authorization, permissionController.getPermissionSchema);

module.exports = router;
