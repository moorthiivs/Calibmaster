const express = require('express');
const router = express.Router();
const controller = require('../controllers/makeModel.controller');
const Authorization = require("../middleware/check-auth");
const checkPermission = require("../middleware/check-permission");

// All routes in this router require ACCESS_MAKE_MODEL permission
router.use(Authorization);
router.use(checkPermission("ACCESS_MAKE_MODEL"));

// Make routes
router.post('/make', controller.createMake);
router.get('/make', controller.getAllMakes);
router.put('/makes/:id', controller.updateMake);
router.delete('/makes/:id', controller.deleteMake);

// Model routes
router.post('/model', controller.createModel);
router.get('/model', controller.getAllModels);
router.put('/models/:id', controller.updateModel);
router.delete('/models/:id', controller.deleteModel);

// Instrument Code routes
router.post('/instrumentcode', controller.createInstrumentCode);
router.get('/instrumentcode', controller.getAllInstrumentCodes);
router.put('/instrumentcodes/:id', controller.updateInstrumentCode);
router.delete('/instrumentcodes/:id', controller.deleteInstrumentCode);

module.exports = router;
