const express = require("express");

const srfSearchController = require("../controllers/srf-search-controller");

const router = express.Router();

router.post("/serial-number", srfSearchController.searchBySerialNo);

router.post("/dispatch-number", srfSearchController.searchByDispatchNo);

router.post("/identification-details", srfSearchController.searchByIdentificationDetails);

router.post("/srf-items", srfSearchController.SearchBySRFItems);

router.post("/inward-number", srfSearchController.searchByInwardNo);

module.exports = router;
