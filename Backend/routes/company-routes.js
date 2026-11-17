const express = require("express");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const companyController = require("../controllers/company-controller");

const router = express.Router();

router.post("/new", Authorization, checkPermission("CREATE_COMPANY"), companyController.newcompanyHandler);
router.post("/getall", Authorization, checkPermission(["LIST_COMPANY", "CREATE_CUSTOMER", "EDIT_CUSTOMER"]), companyController.getallCompanies);

module.exports = router;
