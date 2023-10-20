const express = require("express");

const Authorization = require("../middleware/check-auth");

const router = express.Router();

const mailController = require("../controllers/mail-controller");

// ! Test API
router.get("/send", Authorization, mailController.mailSendFromLab);

// ! Test API Later it will be converted into cron job
router.get("/send-srfItems-mail", Authorization, mailController.srfItems);

module.exports = router;