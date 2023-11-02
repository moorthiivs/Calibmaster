const express = require("express");
const router = express.Router();

const { exportExcel } = require("../controllers/excel-controller");

router.get("/export-excel", exportExcel);

module.exports = router;