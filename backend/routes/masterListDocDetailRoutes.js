const express = require('express');
const router = express.Router();
const controller = require('../controllers/Document-details-controller');

router.post('/create', controller.createDocDetail);
router.get('/fetchAll', controller.getAllDocDetails);
router.put('/update/:detailId', controller.updateMasterDocDetails);
router.get('/:detailId', controller.getMasterListDocDetailsById);

module.exports = router;
