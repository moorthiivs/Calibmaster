const express = require("express");

const Authorization = require("../middleware/check-auth");

const router = express.Router();

const customerController = require("../controllers/customer-controller");

router.post("/create", Authorization, customerController.createCustomer);

router.post("/list", Authorization, customerController.listCustomer);

router.get("/fetch-customer/:id", Authorization, customerController.fetchCustomer);

router.post("/edit-customer", Authorization, customerController.editCustomer);

router.delete("/delete-customer",Authorization,customerController.deleteCustomer);

router.get(
  "/fetch_customer/:id",
  Authorization,
  customerController.fetchCustomer_Company
)

module.exports = router;