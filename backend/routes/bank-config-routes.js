const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const controller = require("../controllers/bank-configuration-controller");

const router = express.Router();

router.post("/create-or-update", Authorization, checkPermission("ACCESS_BANK_CONFIG"), controller.CreateORUpdate);
router.get("/fetch-config/:lab_id", Authorization, checkPermission("ACCESS_BANK_CONFIG"), controller.fetchConfig);

module.exports = router;