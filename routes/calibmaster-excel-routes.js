// const express = require("express");
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');

// const controller = require("../controllers/calibmaster-excel-controller");

// const router = express.Router();

  
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, '..excel-procedure'));
//     },
//     filename: function (req, file, cb) {
//         const name = file.originalname;
//         cb(null, name);
//     }
// });

// const upload = multer({ storage: storage });

// router.post("/create-calibmaster-excel",upload.single('excel_file'), controller.CreateCalibmasterExcel);


// router.get("/fetch-calibmaster-excel/:lab_id", controller.FetchCalibmasterExcel);

// router.post("/fetchOne-calibmaster-excel", controller.FetchOneCalibmasterExcel);

// router.put("/update-calibmaster-excel",controller.updateCalibmasterExcel)




// module.exports = router;



const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

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

router.post(
  "/create-calibmaster-excel",
  upload.single("excel_file"),
  controller.CreateCalibmasterExcel
);

router.get("/fetch-calibmaster-excel/:lab_id", controller.FetchCalibmasterExcel);

router.post("/fetchOne-calibmaster-excel", controller.FetchOneCalibmasterExcel);

router.put("/update-calibmaster-excel", controller.updateCalibmasterExcel);

router.delete("/delete-calibmaster-excel", controller.DeleteCalibmasterExcel);


module.exports = router;
