const express = require("express");
const router = express.Router();

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const instrumentTypeController = require("../controllers/instrument-type-controller");

router.post("/create", Authorization, checkPermission("CREATE_INSTRUMENT_VARIANT"), instrumentTypeController.createInstrumentType);
router.post("/list", Authorization, checkPermission(["LIST_INSTRUMENT_VARIANT", "CREATE_INSTRUMENT", "EDIT_INSTRUMENT", "CREATE_INSTRUMENT_VARIANT"]), instrumentTypeController.listInstrumentTypes);
router.get("/searchByName", Authorization, checkPermission(["LIST_INSTRUMENT_VARIANT", "CREATE_INSTRUMENT", "EDIT_INSTRUMENT", "CREATE_INSTRUMENT_VARIANT"]), instrumentTypeController.searchByName);
router.get("/fetch/:id", Authorization, checkPermission(["LIST_INSTRUMENT_VARIANT", "EDIT_INSTRUMENT_VARIANT"]), instrumentTypeController.fetchById);
router.post("/edit", Authorization, checkPermission("EDIT_INSTRUMENT_VARIANT"), instrumentTypeController.editInstrumentType);
router.post("/filter", Authorization, checkPermission(["LIST_INSTRUMENT_VARIANT", "CREATE_INSTRUMENT", "EDIT_INSTRUMENT", "CREATE_INSTRUMENT_VARIANT"]), instrumentTypeController.filterInstrumentTypes);
router.post("/listCategoryofInstruments", Authorization, checkPermission(["LIST_INSTRUMENT_VARIANT", "CREATE_INSTRUMENT", "EDIT_INSTRUMENT", "CREATE_INSTRUMENT_VARIANT"]), instrumentTypeController.listCategoryofInstruments);
router.delete("/delete", Authorization, checkPermission("DELETE_INSTRUMENT_VARIANT"), instrumentTypeController.deleteinstrumentype);

module.exports = router;
