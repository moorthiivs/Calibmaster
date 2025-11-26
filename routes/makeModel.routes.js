const express = require('express');
const router = express.Router();
const controller = require('../controllers/makeModel.controller');

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

module.exports = router;
