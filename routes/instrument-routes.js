const express = require("express");
const router = express.Router();

const Authorization = require("../middleware/check-auth");

const instrumentController = require("../controllers/instrument-controller");

router.post("/list", Authorization, instrumentController.ListInstrument);
router.post("/create", Authorization, instrumentController.createInstrument);
router.get(
  "/searchByName/:name&:lab_id",
  Authorization,
  instrumentController.searchByName
);
router.get("/fetch/:id", Authorization, instrumentController.fetchById);
router.post("/edit", Authorization, instrumentController.editInstrument);

module.exports = router;
