const express = require("express");
const router = express.Router();

const Authorization = require("../middleware/check-auth");
const instrumentTypeController = require("../controllers/instrument-type-controller");

router.post("/create", Authorization, instrumentTypeController.createInstrumentType);

router.post("/list", Authorization, instrumentTypeController.listInstrumentTypes);

router.get("/searchByName/:name", Authorization, instrumentTypeController.searchByName);

router.get("/fetch/:id", Authorization, instrumentTypeController.fetchById);

router.post("/edit", Authorization, instrumentTypeController.editInstrumentType);

module.exports = router;
