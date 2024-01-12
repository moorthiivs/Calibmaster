const express = require("express");

const challanController = require("../controllers/challan-controller");

const router = express.Router();

// ! Test Route for delivery-challan
router.get("/delivery-challan", challanController.generate);
router.get("/pdf-create-node", challanController.pdfCreateNode);

// *** Send Delivery Challan Mail ***
router.post("/mail-delivery-challan", challanController.sendDeliveryChallan);

module.exports = router;