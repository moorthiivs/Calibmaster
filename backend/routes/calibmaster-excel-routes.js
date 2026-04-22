const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const controller = require("../controllers/calibmaster-excel-controller");

const router = express.Router();

const uploadDir = path.join(__dirname, "../excel_procedure");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const name = file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });

// Calibmaster Excel — granular CRUD permissions
router.post(
  "/create-calibmaster-excel",
  Authorization,
  checkPermission("CREATE_EXCEL"),
  upload.single("excel_file"),
  controller.CreateCalibmasterExcel
);

router.get(
  "/fetch-calibmaster-excel/:lab_id",
  Authorization,
  checkPermission("LIST_EXCEL"),
  controller.FetchCalibmasterExcel
);

router.post(
  "/fetchOne-calibmaster-excel",
  Authorization,
  checkPermission(["LIST_EXCEL", "ENTER_RESULT"]),
  controller.FetchOneCalibmasterExcel
);

router.put(
  "/update-calibmaster-excel",
  Authorization,
  checkPermission("EDIT_EXCEL"),
  controller.updateCalibmasterExcel
);

router.delete(
  "/delete-calibmaster-excel",
  Authorization,
  checkPermission("DELETE_EXCEL"),
  controller.DeleteCalibmasterExcel
);

router.put(
  "/update-Procedure-Image",
  Authorization,
  checkPermission("EDIT_EXCEL"),
  controller.updateProcedureImage
);

router.delete(
  "/delete-Procedure-Image",
  Authorization,
  checkPermission("DELETE_EXCEL"),
  controller.deleteProcedureImage
);

module.exports = router;
