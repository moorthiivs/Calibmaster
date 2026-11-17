const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const GenerateCertificatesController = require("../controllers/Generate-Certificate-Controller");

const router = express.Router();

// Certificate generation requires ENTER_RESULT or AUTHORIZE_RESULT level access
router.post("/generate", Authorization, checkPermission(["UPDATE_RESULT"]), GenerateCertificatesController.generate);
router.post("/download", Authorization, checkPermission(["AUTHORIZE_RESULT", "REVIEW_RESULT", "ENTER_RESULT", "UPDATE_RESULT", "LIST_SRF"]), GenerateCertificatesController.download);
router.post("/verify_certificate", Authorization, checkPermission(["AUTHORIZE_RESULT", "REVIEW_RESULT", "ENTER_RESULT", "UPDATE_RESULT", "LIST_SRF"]), GenerateCertificatesController.verify_certificate);
router.get("/standard_details", Authorization, checkPermission(["AUTHORIZE_RESULT", "REVIEW_RESULT", "ENTER_RESULT", "UPDATE_RESULT", "LIST_SRF"]), GenerateCertificatesController.standard_details);
router.get("/bulkDownload_Certificate", Authorization, checkPermission(["BULK_DOWNLOAD_CERTIFICATE", "LIST_SRF"]), GenerateCertificatesController.bulkDownload_Certificate);
router.post("/preview", Authorization, checkPermission(["EDIT_EXCEL", "LIST_SRF", "ENTER_RESULT"]), GenerateCertificatesController.previewCertificate);

module.exports = router;