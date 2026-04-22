const express = require("express");
const controller = require("../controllers/instrument-variant-type-controller");
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

const router = express.Router();

router.post('/create', Authorization, checkPermission("CREATE_INSTRUMENT_VARIANT"), controller.Create);
router.get('/fetch', Authorization, checkPermission(["LIST_INSTRUMENT_VARIANT", "CREATE_INSTRUMENT_VARIANT"]), controller.Fetch);
router.put('/update/:id', Authorization, checkPermission("CREATE_INSTRUMENT_VARIANT"), controller.Update);
router.delete('/delete/:id', Authorization, checkPermission("CREATE_INSTRUMENT_VARIANT"), controller.Delete);

module.exports = router;