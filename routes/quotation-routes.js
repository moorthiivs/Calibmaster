const express = require("express");

const Quotation = require("../controllers/quotation-generate-controller");

const router = express.Router();

router.post("/create-quotation", Quotation.createQuotation);

router.post("/config-quotation", Quotation.config_quotation);

router.get("/fetch-lab-quotation-config/:lab_id", Quotation.fetch_quotation_config);

router.post("/update-config-quotation", Quotation.update_config_quotation);

router.get("/fetch-lab-quotation-customer-list/:lab_id", Quotation.fetch_quotation_customer_list);

router.post("/view", Quotation.download);

module.exports = router;