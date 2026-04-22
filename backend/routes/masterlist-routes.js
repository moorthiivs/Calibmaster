const express = require("express");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const masterlistController = require("../controllers/masterlist-controller");

const router = express.Router();

router.post("/addcomponent", Authorization, checkPermission("CREATE_MASTERLIST"), masterlistController.addcomponent);
router.post("/getall", Authorization, checkPermission(["LIST_MASTERLIST", "CREATE_CUSTOMER", "EDIT_CUSTOMER"]), masterlistController.getMasterlist);
router.post("/updatebyid", Authorization, checkPermission("EDIT_MASTERLIST"), masterlistController.updatecomponent);
router.post("/deletebyid", Authorization, checkPermission("DELETE_MASTERLIST"), masterlistController.deletecomponent);

router.get("/testController", Authorization, masterlistController.testController);

module.exports = router;
