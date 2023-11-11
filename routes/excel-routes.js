const express = require("express");
const router = express.Router();

const { exportExcel, downloadExcel } = require("../controllers/excel-controller");

router.get("/export-excel", exportExcel);

router.post("/download-excel", downloadExcel);

module.exports = router;