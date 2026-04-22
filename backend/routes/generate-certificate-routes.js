const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const GenerateCertificatesController = require("../controllers/Generate-Certificate-Controller");

const router = express.Router();

// Certificate generation requires ENTER_RESULT or AUTHORIZE_RESULT level access
router.post("/generate", Authorization, checkPermission(["AUTHORIZE_RESULT", "ENTER_RESULT", "UPDATE_RESULT"]), GenerateCertificatesController.generate);
router.post("/download", Authorization, checkPermission("LIST_SRF"), GenerateCertificatesController.download);
router.post("/verify_certificate", Authorization, checkPermission("LIST_SRF"), GenerateCertificatesController.verify_certificate);
router.get("/standard_details", Authorization, checkPermission("LIST_SRF"), GenerateCertificatesController.standard_details);
router.get("/bulkDownload_Certificate", Authorization, checkPermission(["UPLOAD_CERTIFICATE", "LIST_SRF"]), GenerateCertificatesController.bulkDownload_Certificate);
router.post("/preview", Authorization, checkPermission("LIST_SRF"), GenerateCertificatesController.previewCertificate);

module.exports = router;