const express = require("express");

const firstFromTableController = require("../controllers/first-from-table-controller");

const router = express.Router();

router.post("/create", firstFromTableController.create);

router.post("/list", firstFromTableController.list);

router.post("/fetch", firstFromTableController.fetch);

module.exports = router;
