const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const router = express.Router();

const customerController = require("../controllers/customer-controller");

router.post("/create", Authorization, checkPermission("CREATE_CUSTOMER"), customerController.createCustomer);
router.post("/list", Authorization, checkPermission("LIST_CUSTOMER"), customerController.listCustomer);
router.get("/fetch-customer/:id", Authorization, checkPermission("LIST_CUSTOMER"), customerController.fetchCustomer);
router.post("/edit-customer", Authorization, checkPermission("EDIT_CUSTOMER"), customerController.editCustomer);
router.delete("/delete-customer", Authorization, checkPermission("DELETE_CUSTOMER"), customerController.deleteCustomer);
router.get("/fetch_customer/:id", Authorization, checkPermission("LIST_CUSTOMER"), customerController.fetchCustomer_Company);

module.exports = router;