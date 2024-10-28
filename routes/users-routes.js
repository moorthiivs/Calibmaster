const express = require("express");

const Authorization = require("../middleware/check-auth");

const usersController = require("../controllers/users-controller");

const router = express.Router();

router.post("/login", usersController.login);

router.post("/adduser", Authorization, usersController.adduser);

router.post("/getall", Authorization, usersController.getAllUsers);

router.post("/getuserbyid", Authorization, usersController.getuserbyid);

router.post("/updateuser", Authorization, usersController.updateuser);

router.post("/deleteuser", Authorization, usersController.deleteuser);

router.post("/reset-password", Authorization, usersController.resetPassword);

router.post("/admin-reset-password", Authorization, usersController.adminResetPassword);

router.post("/enableuser", Authorization, usersController.enableuser)

router.get(
  "/getuserbyLabid/:labId",
  Authorization,
  usersController.fetchUsersByLabId
);

module.exports = router;
