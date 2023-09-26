const express = require("express");
const multer = require("multer");
const certificateController = require("../controllers/certificate-controller");

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
router.post(
  "/upload",
  upload.single("file"),
  certificateController.certificateUploadHandler
);

module.exports = router;
