const express = require("express");
const certificateFormatcontroller = require("../controllers/certificateFormat-controller");

const router = express.Router();

// Create or update format
router.post("/create", certificateFormatcontroller.createFormat);

// Get format by labId
router.get("/:labId", certificateFormatcontroller.fetchoneFormat);


router.post("/format-no-config", certificateFormatcontroller.formatNoConfig);


module.exports = router;
