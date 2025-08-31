const express = require("express");

const GenerateCertificatesController = require("../controllers/Generate-Certificate-Controller");

const router = express.Router();

router.post("/generate", GenerateCertificatesController.generate);

router.post("/download", GenerateCertificatesController.download);

router.post("/verify_certificate", GenerateCertificatesController.verify_certificate);

router.get("/standard_details", GenerateCertificatesController.standard_details);

router.get("/bulkDownload_Certificate", GenerateCertificatesController.bulkDownload_Certificate)

module.exports = router;