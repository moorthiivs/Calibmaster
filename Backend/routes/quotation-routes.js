const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const Quotation = require("../controllers/quotation-generate-controller");

const router = express.Router();

// ALL quotation routes now require Authorization + explicit permissions
router.post("/create-quotation", Authorization, checkPermission("CREATE_QUOTATION"), Quotation.createQuotation);
router.post("/config-quotation", Authorization, checkPermission("ACCESS_QUOTATION_CONFIG"), Quotation.config_quotation);
router.get("/fetch-lab-quotation-config/:lab_id", Authorization, checkPermission("ACCESS_QUOTATION_CONFIG"), Quotation.fetch_quotation_config);
router.post("/update-config-quotation", Authorization, checkPermission("ACCESS_QUOTATION_CONFIG"), Quotation.update_config_quotation);
router.get("/fetch-lab-quotation-customer-list/:lab_id", Authorization, checkPermission("LIST_QUOTATION"), Quotation.fetch_quotation_customer_list);
router.post("/view", Authorization, checkPermission("LIST_QUOTATION"), Quotation.download);

module.exports = router;