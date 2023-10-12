const express = require("express");

const Authorization = require("../middleware/check-auth");

const router = express.Router();

const customerController = require("../controllers/customer-controller");

router.post("/create", Authorization, customerController.createCustomer);
router.post("/list", Authorization, customerController.listCustomer);

module.exports = router;