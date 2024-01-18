const express = require("express");

const resultTableController = require("../controllers/Result-Table-Controller");

const router = express.Router();

router.post("/create", resultTableController.create);

router.post("/list", resultTableController.list);

router.post("/fetch", resultTableController.fetch);

router.post("/update", resultTableController.update);

module.exports = router;
