const express = require("express");

const heartbeatController = require("../controllers/heartbeat-controller");

const router = express.Router();

router.get("/check", heartbeatController.heartbeatHandler);

module.exports = router;
