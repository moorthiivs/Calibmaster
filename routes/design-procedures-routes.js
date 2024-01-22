const express = require("express");

const DesignProceduresController = require("../controllers/Design-Procedures-Controller");

const router = express.Router();

router.post("/create", DesignProceduresController.create);

router.post("/findAllList", DesignProceduresController.findAllList);

router.post("/list", DesignProceduresController.list);

router.post("/fetch", DesignProceduresController.fetch);

router.post("/update", DesignProceduresController.update);

module.exports = router;
