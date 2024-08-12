const express = require("express");

const labController = require("../controllers/lab-controller");

const editLabController = require("../controllers/edit-lab-controller");

const router = express.Router();

router.post("/new", labController.addlab);

router.get("/listing", labController.getAllLabs);

router.post("/fetchLab", labController.fetchLab);
router.post("/fetchLabById", labController.fetchLabById)

router.post("/edit-lab", editLabController.editLab);

router.post("/testmail", labController.testmailhandler);

router.post("/emailconfig", labController.emailconfigHandler);

router.post("/fetch-lab-smtp-config", labController.fetchLabSmtpConfig);

router.post("/update-lab-smtp-config", labController.updateLabSMTPConfig);

module.exports = router;
