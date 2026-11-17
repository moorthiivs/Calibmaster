const express = require("express");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const Controller = require("../controllers/Uncertainty-Master-Parameters-Controller");

const router = express.Router();

router.post("/create", Authorization, checkPermission("CREATE_MASTER"), Controller.create);

router.get("/fetch-by-Id/:uncertainty_master_parameter_id/:lab_id", Authorization, checkPermission(["LIST_MASTER", "CREATE_MASTER"]), Controller.fetchById);

router.get("/list/:lab_id", Authorization, checkPermission("LIST_MASTER"), Controller.list);

router.post("/update", Authorization, checkPermission("EDIT_MASTER"), Controller.update);

router.post("/update-by-status", Authorization, checkPermission("EDIT_MASTER"), Controller.updateByStatus);

module.exports = router;