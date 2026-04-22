const express = require("express");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const ulrNoGenerationController = require("../controllers/ULR-No-Generation-Controller");

const router = express.Router();

router.use(Authorization);

router.post("/ulr-update", checkPermission("CREATE_ULR"), ulrNoGenerationController.create);
router.post("/next-year-ulr", checkPermission("CREATE_ULR"), ulrNoGenerationController.nextYearUlr);
router.get("/fetch-ulr/:lab_id", checkPermission("LIST_ULR"), ulrNoGenerationController.fetchULR);
router.get("/ulr-setup/:lab_id", checkPermission("LIST_ULR"), ulrNoGenerationController.ulrSetUp);
router.post("/get-ulr", checkPermission("LIST_ULR"), ulrNoGenerationController.getUlr);
router.post("/update-ulr-number", checkPermission("CREATE_ULR"), ulrNoGenerationController.updateULRNumber);

module.exports = router;