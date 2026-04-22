const express = require("express");

const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const usersController = require("../controllers/users-controller");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/employee_signature");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

// Public — no permission needed
router.post("/login", usersController.login);

// Refresh access token using a valid refresh token (public — no Bearer header needed)
router.post("/refresh-token", usersController.refreshTokenHandler);

// Logout — revoke refresh token (requires valid access token)
router.post("/logout", Authorization, usersController.logoutUser);

// Admin reset user password — requires PASSWORD_RESET_USER
router.post("/reset-password", Authorization, checkPermission("PASSWORD_RESET_USER"), usersController.resetPassword);

// User management — requires explicit permissions
router.post("/adduser", Authorization, checkPermission("CREATE_USER"), upload.single("employee_signature"), usersController.adduser);
router.post("/getall", Authorization, checkPermission(["LIST_USER", "EDIT_USER", "ENTER_RESULT"]), usersController.getAllUsers);
router.post("/getuserbyid", Authorization, checkPermission(["LIST_USER", "EDIT_USER"]), usersController.getuserbyid);
router.post("/updateuser", Authorization, checkPermission("EDIT_USER"), upload.single("employee_signature"), usersController.updateuser);
router.post("/disableuser", Authorization, checkPermission("EDIT_USER"), usersController.disableuser);
router.post("/enableuser", Authorization, checkPermission("EDIT_USER"), usersController.enableuser);
router.post("/deleteuser", Authorization, checkPermission("DELETE_USER"), usersController.deleteuser);
router.post("/admin-reset-password", Authorization, checkPermission("EDIT_USER"), usersController.adminResetPassword);

router.get(
  "/getuserbyLabid/:labId",
  Authorization,
  checkPermission(["LIST_USER", "EDIT_USER"]),
  usersController.fetchUsersByLabId
);

module.exports = router;
