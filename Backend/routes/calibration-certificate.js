const express = require("express");

const calibrationCertificateController = require("../controllers/calibration-certificate-controller");

const router = express.Router();

router.post("/verniercaliper", calibrationCertificateController.verniercaliper);

router.post("/generate", calibrationCertificateController.generate);

module.exports = router;
