const express = require("express");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const rolesController = require("../controllers/roles-controller");

const router = express.Router();

router.post("/list", Authorization, checkPermission(["ACCESS_ROLES", "CREATE_USER", "EDIT_USER"]), rolesController.list);
router.post("/create", Authorization, checkPermission("ACCESS_ROLES"), rolesController.create);
router.post("/update", Authorization, checkPermission("EDIT_ROLE"), rolesController.update);
router.post("/delete", Authorization, checkPermission("DELETE_ROLE"), rolesController.remove);

module.exports = router;
