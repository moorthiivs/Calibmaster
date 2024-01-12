const express = require("express");
const multer = require("multer");

const srfController = require("../controllers/srf-controller");

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, "invoices");
    },
    filename: (req, file, callBack) => {
        callBack(null, `${file.originalname}`);
    },
});
let upload = multer({ storage });

router.post("/add", srfController.addSRFHandler);

router.post("/getall", srfController.getSRFs);

router.post("/getsrfbyid", srfController.getsrfbyId);

router.post("/additemtosrf", srfController.addItemtoSRF);

router.post("/updateitem", srfController.updateSRFItem);

router.post("/deleteitem", srfController.deleteSRFItem);

router.post("/updatedcinfo", srfController.updateDCInfo);

router.post("/updatecalinfo", srfController.updateCalInfo);

// *** Update-Invoice
router.post("/updateinvoice", srfController.updateInvoiceInfo);

router.post("/updatepayment", srfController.updatePaymentInfo);

router.post("/getfilteredsrfitems", srfController.getfilteredSRFItems);

// *** Select SRF-Items Belongs to current Lab ***
router.post("/getSrfItems", srfController.getSrfItems);

router.post("/fetchSrfItem", srfController.fetchSrfItem);

module.exports = router;
