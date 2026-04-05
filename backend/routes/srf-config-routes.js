const express = require("express");

const srfConfigController = require("../controllers/srf-config-controller");

const router = express.Router();

router.post("/create", srfConfigController.createConfig);
router.get("/fetch/:lab_id", srfConfigController.fetchConfig);
router.post("/edit", srfConfigController.editConfig);

module.exports = router;
