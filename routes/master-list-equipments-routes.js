const express = require("express");

const masterListEquipmentController = require("../controllers/master-list-equipment-controller");

const router = express.Router();

router.post("/create", masterListEquipmentController.create);

module.exports = router;
