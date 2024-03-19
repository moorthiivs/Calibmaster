const express = require("express");

const Authorization = require("../middleware/check-auth");

const ulrNoGenerationController = require("../controllers/ULR-No-Generation-Controller");

const router = express.Router();

router.post("/ulr-update", ulrNoGenerationController.create);

router.get("/ulr-setup/:lab_id", ulrNoGenerationController.ulrSetUp);

router.post("/get-ulr", ulrNoGenerationController.getUlr);

router.post("/next-year-ulr", ulrNoGenerationController.nextYearUlr);

router.post("/update-ulr-number", ulrNoGenerationController.updateULRNumber);

module.exports = router;