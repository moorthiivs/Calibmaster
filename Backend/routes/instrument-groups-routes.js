const express = require("express");
const router = express.Router();

const Authorization = require("../middleware/check-auth");

const instrumentGroupsController = require("../controllers/instrument-groups-controller");

router.get("/list", Authorization, instrumentGroupsController.ListInstrumentGroups);
router.get("/fetch/:id", Authorization, instrumentGroupsController.FindInstrumentGroups);

module.exports = router;
