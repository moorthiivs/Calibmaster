const express = require("express");

const controller = require("../controllers/bank-configuration-controller");

const router = express.Router();

router.post("/create-or-update", controller.CreateORUpdate);
router.get("/fetch-config/:lab_id", controller.fetchConfig);

module.exports = router;