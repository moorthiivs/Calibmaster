const express = require("express");
const resultTableController = require("../controllers/Result-Table-Controller");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const router = express.Router();

router.post("/create", Authorization, checkPermission("ENTER_RESULT"), resultTableController.create);
router.post("/list", Authorization, checkPermission(["ENTER_RESULT", "UPDATE_RESULT", "REVIEW_RESULT", "AUTHORIZE_RESULT"]), resultTableController.list);
router.post("/fetch", Authorization, checkPermission(["ENTER_RESULT", "UPDATE_RESULT", "REVIEW_RESULT", "AUTHORIZE_RESULT"]), resultTableController.fetch);
router.post("/update", Authorization, checkPermission("UPDATE_RESULT"), resultTableController.update);

module.exports = router;
