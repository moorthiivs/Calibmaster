const express = require("express");

const companyController = require("../controllers/company-controller");

const router = express.Router();

router.post("/new", companyController.newcompanyHandler);

router.post("/getall", companyController.getallCompanies);

module.exports = router;
