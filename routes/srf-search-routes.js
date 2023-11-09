const express = require("express");

const srfSearchController = require("../controllers/srf-search-controller");

const router = express.Router();

router.post("/serial-number", srfSearchController.searchBySerialNo);

module.exports = router;
