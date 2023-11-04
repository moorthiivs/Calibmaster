const express = require("express");

const challanController = require("../controllers/challan-controller");

const router = express.Router();

router.get("/delivery-challan", challanController.generate);

module.exports = router;
