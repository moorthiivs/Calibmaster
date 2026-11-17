const express = require("express");
const multer = require("multer");
const certificateController = require("../controllers/certificate-controller");
const CertificateSync = require("../controllers/certificate_controller_for_sync");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, "certificates");
  },
  filename: (req, file, callBack) => {
    callBack(null, `${file.originalname}`);
  },
});
let upload = multer({ storage });

router.post("/upload", upload.single("file"), certificateController.certificateUploadHandler);

router.post("/fetchCertificateById", CertificateSync.fetchCertificateById);

module.exports = router;
