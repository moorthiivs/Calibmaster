const express = require("express");
const router = express.Router();

const Authorization = require("../middleware/check-auth");

const instrumentController = require("../controllers/instrument-controller");

router.get("/list", Authorization, instrumentController.ListInstrument);
router.post("/create", Authorization, instrumentController.createInstrument);

module.exports = router;
