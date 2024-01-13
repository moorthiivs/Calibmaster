const express = require("express");

const router = express.Router();

const CMSSettingController = require("../controllers/CMS-Setting-Controller");

router.post("/create-cms-certificate", CMSSettingController.create_cms_certificate);

router.get("/fetch-cms-certificate", CMSSettingController.fetch_cms_certificate);

router.post("/edit-cms-certificate", CMSSettingController.edit_cms_certificate);

module.exports = router;
