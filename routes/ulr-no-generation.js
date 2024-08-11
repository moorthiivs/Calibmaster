const express = require("express");

const Authorization = require("../middleware/check-auth");

const ulrNoGenerationController = require("../controllers/ULR-No-Generation-Controller");

const router = express.Router();

router.post("/ulr-update", ulrNoGenerationController.create);

router.post("/next-year-ulr", ulrNoGenerationController.nextYearUlr);

router.get("/fetch-ulr/:lab_id", ulrNoGenerationController.fetchULR);

router.get("/ulr-setup/:lab_id", ulrNoGenerationController.ulrSetUp);

router.post("/get-ulr", ulrNoGenerationController.getUlr);

router.post("/update-ulr-number", ulrNoGenerationController.updateULRNumber);

module.exports = router;