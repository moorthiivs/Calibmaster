const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const router = express.Router();

const uomController = require("../controllers/uom-controller");

router.post("/create", Authorization, checkPermission("CREATE_UOM"), uomController.createUom);
router.get("/fetch/:id", Authorization, checkPermission("LIST_UOM"), uomController.findUom);
router.post("/edit", Authorization, checkPermission("EDIT_UOM"), uomController.editUom);
router.get("/list", Authorization, checkPermission(["LIST_UOM", "LIST_INSTRUMENT", "CREATE_INSTRUMENT", "EDIT_INSTRUMENT", "LIST_SRF", "CREATE_SRF", "CREATE_INSTRUMENT_VARIANT"]), uomController.listUom);
router.get("/searchByName/:name", Authorization, checkPermission(["LIST_UOM", "LIST_INSTRUMENT", "CREATE_INSTRUMENT", "EDIT_INSTRUMENT", "CREATE_INSTRUMENT_VARIANT"]), uomController.searchByName);
router.get("/searchByKindOfQuantity/:name", Authorization, checkPermission(["LIST_UOM", "LIST_INSTRUMENT", "CREATE_INSTRUMENT", "EDIT_INSTRUMENT", "CREATE_INSTRUMENT_VARIANT"]), uomController.searchByKindOfQuantity);
router.delete("/delete/:id", Authorization, checkPermission("DELETE_UOM"), uomController.deleteUom);

module.exports = router;
