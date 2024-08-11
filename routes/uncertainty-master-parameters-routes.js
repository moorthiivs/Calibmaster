const express = require("express");

const Controller = require("../controllers/Uncertainty-Master-Parameters-Controller");

const router = express.Router();

router.post("/create", Controller.create);

router.get("/fetch-by-Id/:uncertainty_master_parameter_id/:lab_id", Controller.fetchById);

router.get("/list/:lab_id", Controller.list);

router.post("/update", Controller.update);

router.post("/update-by-status", Controller.updateByStatus);

module.exports = router;