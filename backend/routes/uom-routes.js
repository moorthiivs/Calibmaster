const express = require("express");

const Authorization = require("../middleware/check-auth");

const router = express.Router();

const uomController = require("../controllers/uom-controller");

router.post("/create", Authorization, uomController.createUom);

router.get("/fetch/:id", Authorization, uomController.findUom);

router.post("/edit", Authorization, uomController.editUom);

router.get("/list", Authorization, uomController.listUom);

router.get("/searchByName/:name", Authorization, uomController.searchByName);

router.get("/searchByKindOfQuantity/:name", Authorization, uomController.searchByKindOfQuantity);

module.exports = router;
