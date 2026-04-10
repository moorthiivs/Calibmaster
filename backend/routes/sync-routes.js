const express = require("express");
const router = express.Router();
const Authorization = require("../middleware/check-auth");
const syncController = require("../controllers/sync-controller");

// POST /api/sync/push   — Electron → Server (calibration data + status updates)
router.post("/push",        Authorization, syncController.pushSync);

// GET  /api/sync/pull   — Server → Electron (tasks updated since last_sync_timestamp)
router.get("/pull",         Authorization, syncController.pullSync);

// POST /api/sync/acknowledge — Mark tasks as synced on server
router.post("/acknowledge", Authorization, syncController.acknowledgeSync);

module.exports = router;
