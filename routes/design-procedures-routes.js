const express = require("express");

const DesignProceduresController = require("../controllers/Design-Procedures-Controller");

const router = express.Router();

router.post("/create", DesignProceduresController.create);

module.exports = router;
