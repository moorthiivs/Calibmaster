const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");
const DesignProceduresController = require("../controllers/Design-Procedures-Controller");

const router = express.Router();

// Procedures — granular CRUD permissions
router.post("/create", Authorization, checkPermission("CREATE_PROCEDURE"), DesignProceduresController.create);
router.post("/findAllList", Authorization, checkPermission(["LIST_PROCEDURE", "ENTER_RESULT"]), DesignProceduresController.findAllList);
router.post("/list", Authorization, checkPermission(["LIST_PROCEDURE", "ENTER_RESULT"]), DesignProceduresController.list);
router.post("/fetch", Authorization, checkPermission(["LIST_PROCEDURE", "ENTER_RESULT"]), DesignProceduresController.fetch);
router.post("/view-defined-procedure", Authorization, checkPermission(["LIST_PROCEDURE", "ENTER_RESULT"]), DesignProceduresController.viewDefinedProcedures);
router.post("/duplicate-defined-procedure", Authorization, checkPermission("CREATE_PROCEDURE"), DesignProceduresController.duplicateDefinedProcedures);
router.post("/update", Authorization, checkPermission("EDIT_PROCEDURE"), DesignProceduresController.update);
router.delete("/delete", Authorization, checkPermission("DELETE_PROCEDURE"), DesignProceduresController.deletes);

router.post("/create_procedure_uncertainties", Authorization, checkPermission("CREATE_PROCEDURE"), DesignProceduresController.create_procedure_uncertainties);
router.post("/find_uncertainty_master_parameters", Authorization, checkPermission(["LIST_PROCEDURE", "ENTER_RESULT"]), DesignProceduresController.find_uncertainty_master_parameters);
router.post("/edit_uncertainty_master_parameters", Authorization, checkPermission("EDIT_PROCEDURE"), DesignProceduresController.edit_uncertainty_master_parameters);
router.post("/listProcedure", Authorization, checkPermission(["LIST_PROCEDURE", "ENTER_RESULT"]), DesignProceduresController.listProcedure);

module.exports = router;