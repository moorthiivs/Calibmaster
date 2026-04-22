const express = require("express");
const multer = require("multer");

const srfController = require("../controllers/srf-controller");
const srfItemsDCController = require("../controllers/srf-items-dc-controller");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

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

// Create & List — require specific permissions
router.post("/add", Authorization, checkPermission("CREATE_SRF"), srfController.addSRFHandler);
router.post("/getall", Authorization, checkPermission("LIST_SRF"), srfController.getSRFs);
router.post("/getsrfbyid", Authorization, checkPermission("VIEW_SRF"), srfController.getsrfbyId);

// SRF Item management — item-level granular permissions
router.post("/additemtosrf", Authorization, checkPermission("CREATE_SRF"), srfController.addItemtoSRF);
router.post("/addbulkitemtosrf", Authorization, checkPermission("CREATE_SRF"), srfController.addBulkItemtoSRF);
router.post("/updateitem", Authorization, checkPermission(["EDIT_SRF_ITEM", "EDIT_SRF"]), srfController.updateSRFItem);

// SRF Delete — SRF-level vs item-level split
router.delete("/deletesrf", Authorization, checkPermission("DELETE_SRF"), srfController.deleteSRF);
router.post("/deleteitem", Authorization, checkPermission(["DELETE_SRF_ITEM", "DELETE_SRF"]), srfController.deleteSRFItem);

// Info updates — SRF-level edit access
router.post("/updatedcinfo", Authorization, checkPermission("EDIT_SRF"), srfController.updateDCInfo);
router.post("/updatecalinfo", Authorization, checkPermission("EDIT_SRF"), srfController.updateCalInfo);
router.post("/updateinvoice", Authorization, checkPermission("EDIT_SRF"), srfController.updateInvoiceInfo);
router.post("/updatepayment", Authorization, checkPermission("EDIT_SRF"), srfController.updatePaymentInfo);

// Read-only SRF item queries — require LIST_SRF_ITEM or VIEW_SRF_ITEM (or LIST_SRF as fallback)
router.post("/getfilteredsrfitems", Authorization, checkPermission(["LIST_SRF_ITEM", "VIEW_SRF_ITEM", "LIST_SRF"]), srfController.getfilteredSRFItems);
router.post("/getSrfItems", Authorization, checkPermission(["LIST_SRF_ITEM", "VIEW_SRF_ITEM", "LIST_SRF"]), srfController.getSrfItems);
router.post("/fetchSrfItem", Authorization, checkPermission(["VIEW_SRF_ITEM", "LIST_SRF_ITEM", "LIST_SRF"]), srfController.fetchSrfItem);
router.post("/findbyAssestid", Authorization, checkPermission(["LIST_SRF_ITEM", "VIEW_SRF_ITEM", "LIST_SRF"]), srfController.findbyAssestid);
router.post("/fetchOneSrfItems", Authorization, checkPermission(["VIEW_SRF_ITEM", "LIST_SRF_ITEM", "LIST_SRF"]), srfController.fetchOneSrfItems);

// SRF DC Status updates — calibration workflow
router.put("/update-srf-items-dc-status", Authorization, checkPermission(["EDIT_SRF_ITEM", "EDIT_SRF"]), srfItemsDCController.updateSRFItemsDCStatus);
router.post("/get-srf-items-dc-status", Authorization, checkPermission(["LIST_SRF_ITEM", "VIEW_SRF_ITEM", "LIST_SRF"]), srfItemsDCController.getSRFITEMDCStatus);
router.post("/update-bulk-srf-items-dc-status", Authorization, checkPermission(["EDIT_SRF_ITEM", "EDIT_SRF"]), srfItemsDCController.updateBulkSRFItemsDCStatus);

module.exports = router;
