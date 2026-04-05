const express = require("express");

const certificatesController = require("../controllers/certificates-controller");

const router = express.Router();

router.post("/vernier-caliper-certificate", certificatesController.vernierCaliper);

router.post("/weighing-balance-certificate", certificatesController.weighingBalance);

module.exports = router;