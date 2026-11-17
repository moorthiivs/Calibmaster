const express = require("express");
const CertificateSync = require("../controllers/certificate_controller_for_sync");

const router = express.Router();

router.post("/get_certificate", CertificateSync.fetchCertificatebyfilename);

module.exports = router;
