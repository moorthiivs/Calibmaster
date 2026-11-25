const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/Data-storage-controller");
const checkPermission = require("../middleware/check-permission");

// *** SRF-Item destory ***


router.get("/disk-usage", DashboardController.diskUsageData);

router.get("/deleted-stats", DashboardController.deletedstats)

router.get("/unwanted-certificates", checkPermission("ACCESS_DATA_STORAGE"), DashboardController.getUnwantedCertificates);
router.delete("/unwanted-certificates", checkPermission("ACCESS_DATA_STORAGE"), DashboardController.deleteUnwantedCertificates);

router.delete("/destorysrf", DashboardController.destroySRF);

router.delete("/destoryitem", DashboardController.destroySRFItem);


router.post("/restoresrf", DashboardController.RestoreSRF);
router.post("/restoresrf_item", DashboardController.RestoreSRFItem);

module.exports = router;