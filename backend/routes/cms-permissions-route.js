const express = require("express");

const CMSSettingsPermissionsController = require("../controllers/CMS-Settings-Permissions-Controller");

const router = express.Router();

router.post("/create", CMSSettingsPermissionsController.create);

router.post("/fetch", CMSSettingsPermissionsController.fetch);

router.post("/edit", CMSSettingsPermissionsController.edit);

module.exports = router;