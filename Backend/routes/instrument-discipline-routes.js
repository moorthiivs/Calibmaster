const express = require("express");
const router = express.Router();

const Authorization = require("../middleware/check-auth");

const instrumentController = require("../controllers/instrument-discipline-controller");

router.get("/list", Authorization, instrumentController.ListDiscipline);

module.exports = router;
