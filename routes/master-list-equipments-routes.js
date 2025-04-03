const express = require("express");

const masterListEquipmentController = require("../controllers/master-list-equipment-controller");

const router = express.Router();

router.post("/create", masterListEquipmentController.create);

router.post("/list", masterListEquipmentController.list);

router.post("/find", masterListEquipmentController.find);

router.post("/update", masterListEquipmentController.update);

router.get("/email-remainder", masterListEquipmentController.emailRemainder);

router.post("/view-certificate", masterListEquipmentController.viewCertificate);

router.delete("/delete", masterListEquipmentController.deleteMaster)

module.exports = router;