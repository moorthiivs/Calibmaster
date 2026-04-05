const express = require("express");

const deliveryChallanController = require("../controllers/delivery-challan-controller");

const router = express.Router();

// *** Create Delivery Challan Mail ***
router.post("/create", deliveryChallanController.create);

module.exports = router;