const express = require("express");

const srfController = require("../controllers/srf-controller");

const router = express.Router();

router.post("/add", srfController.addSRFHandler);

router.post("/getall", srfController.getSRFs);

router.post("/getsrfbyid", srfController.getsrfbyId);

router.post("/additemtosrf", srfController.addItemtoSRF);

router.post("/updateitem", srfController.updateSRFItem);

router.post("/deleteitem", srfController.deleteSRFItem);

router.post("/updatedcinfo", srfController.updateDCInfo);

router.post("/updatecalinfo", srfController.updateCalInfo);

router.post("/updateinvoice", srfController.updateInvoiceInfo);

router.post("/updatepayment", srfController.updatePaymentInfo);

router.post("/getfilteredsrfitems", srfController.getfilteredSRFItems);

module.exports = router;
