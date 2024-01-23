const express = require("express");

const GenerateCertificatesController = require("../controllers/Generate-Certificate-Controller");

const router = express.Router();

router.post("/create", GenerateCertificatesController.create);

router.post("/generate", GenerateCertificatesController.generate);

module.exports = router;