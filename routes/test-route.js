const express = require("express");

const testController = require("../controllers/test-controller");

const router = express.Router();

router.post("/check", testController.testHandler);

module.exports = router;
