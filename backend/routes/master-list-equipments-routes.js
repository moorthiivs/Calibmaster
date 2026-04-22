const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const masterListEquipmentController = require("../controllers/master-list-equipment-controller");

const router = express.Router();

router.post("/create", Authorization, checkPermission("CREATE_MASTER"), masterListEquipmentController.create);
router.post("/list", Authorization, checkPermission(["LIST_MASTER", "ENTER_RESULT"]), masterListEquipmentController.list);
router.post("/find", Authorization, checkPermission("LIST_MASTER"), masterListEquipmentController.find);
router.post("/update", Authorization, checkPermission("EDIT_MASTER"), masterListEquipmentController.update);
router.get("/email-remainder", Authorization, checkPermission("LIST_MASTER"), masterListEquipmentController.emailRemainder);
router.post("/view-certificate", Authorization, checkPermission("LIST_MASTER"), masterListEquipmentController.viewCertificate);
router.delete("/delete", Authorization, checkPermission("DELETE_MASTER"), masterListEquipmentController.deleteMaster);

module.exports = router;