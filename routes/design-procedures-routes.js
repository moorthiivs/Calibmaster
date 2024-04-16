const express = require("express");

const DesignProceduresController = require("../controllers/Design-Procedures-Controller");

const router = express.Router();

router.post("/create", DesignProceduresController.create);

router.post("/findAllList", DesignProceduresController.findAllList);

router.post("/list", DesignProceduresController.list);

router.post("/fetch", DesignProceduresController.fetch);

router.post("/view-defined-procedure", DesignProceduresController.viewDefinedProcedures);

router.post("/update", DesignProceduresController.update);

// *** Test Routes ***
router.post("/create_procedure_uncertainties", DesignProceduresController.create_procedure_uncertainties);

router.post("/find_uncertainty_master_parameters", DesignProceduresController.find_uncertainty_master_parameters);

router.post("/edit_uncertainty_master_parameters", DesignProceduresController.edit_uncertainty_master_parameters);

module.exports = router;
