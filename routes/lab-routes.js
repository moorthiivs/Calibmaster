const express = require("express");

const labController = require("../controllers/lab-controller");

const editLabController = require("../controllers/edit-lab-controller");

const router = express.Router();

router.post("/new", labController.addlab);

router.get("/listing", labController.getAllLabs);

router.post("/fetchLab", labController.fetchLab);

router.post("/edit-lab", editLabController.editLab);

router.post("/testmail", labController.testmailhandler);

router.post("/emailconfig", labController.emailconfigHandler);

module.exports = router;
