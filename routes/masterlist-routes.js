const express = require("express");

const masterlistController = require("../controllers/masterlist-controller");

const router = express.Router();

router.post("/addcomponent", masterlistController.addcomponent);

router.post("/getall", masterlistController.getMasterlist);

router.post("/updatebyid", masterlistController.updatecomponent);

router.post("/deletebyid", masterlistController.deletecomponent);

router.get("/testController", masterlistController.testController);

module.exports = router;
