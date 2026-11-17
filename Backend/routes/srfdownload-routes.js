const express = require("express");

const srfdownloadController = require("../controllers/srfdownload-controller");

const router = express.Router();

router.post("/srf", srfdownloadController.srfDownloadHandler);

module.exports = router;