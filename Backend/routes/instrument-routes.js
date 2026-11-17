const express = require("express");
const router = express.Router();

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const instrumentController = require("../controllers/instrument-controller");

router.post("/list", Authorization, checkPermission(["LIST_INSTRUMENT", "ACCESS_MAKE_MODEL"]), instrumentController.ListInstrument);
router.post("/create", Authorization, checkPermission("CREATE_INSTRUMENT"), instrumentController.createInstrument);
router.post("/bulk-create", Authorization, checkPermission("CREATE_INSTRUMENT"), instrumentController.bulkCreateInstruments);
router.get(
  "/searchByName/:name&:lab_id",
  Authorization,
  checkPermission("LIST_INSTRUMENT"),
  instrumentController.searchByName
);
router.get("/fetch/:id", Authorization, checkPermission("LIST_INSTRUMENT"), instrumentController.fetchById);
router.post("/edit", Authorization, checkPermission("EDIT_INSTRUMENT"), instrumentController.editInstrument);

// Instrument Parameters — requires base LIST access
router.get("/instrument-parameters/:instrumentId", Authorization, checkPermission(["LIST_INSTRUMENT", "CREATE_INSTRUMENT", "ACCESS_MAKE_MODEL"]), instrumentController.fetchOneinstrumentParameters);
router.put("/instrument-parameters-update", Authorization, checkPermission(["EDIT_INSTRUMENT", "CREATE_INSTRUMENT", "ACCESS_MAKE_MODEL"]), instrumentController.instrumentParametersUpdate);

router.delete("/instrument-delete", Authorization, checkPermission(["DELETE_INSTRUMENT", "CREATE_INSTRUMENT"]), instrumentController.deleteinstrument);
router.delete("/instrument-parameters-delete", Authorization, checkPermission(["EDIT_INSTRUMENT", "CREATE_INSTRUMENT", "ACCESS_MAKE_MODEL"]), instrumentController.deleteinstrumentParameter);

module.exports = router;
