const express = require("express");

const GenerateCertificatesController = require("../controllers/Generate-Certificate-Controller");

const router = express.Router();

router.post("/generate", GenerateCertificatesController.generate);

router.post("/download", GenerateCertificatesController.download);

router.get("/standard_details", GenerateCertificatesController.standard_details);

module.exports = router;