const express = require("express");

const DynamicCertificatesController = require("../controllers/Dynamic-Certificate-Controller");

const router = express.Router();

router.post("/create", DynamicCertificatesController.create);

module.exports = router;