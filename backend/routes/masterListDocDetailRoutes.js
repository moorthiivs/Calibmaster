const express = require('express');
const router = express.Router();
const Authorization = require('../middleware/check-auth');
const checkPermission = require('../middleware/check-permission');
const controller = require('../controllers/Document-details-controller');

// Master Doc Detail routes — granular CRUD permissions
router.post('/create', Authorization, checkPermission('CREATE_DOC_DETAIL'), controller.createDocDetail);
router.get('/fetchAll', Authorization, checkPermission(['LIST_DOC_DETAIL', 'ENTER_RESULT']), controller.getAllDocDetails);
router.put('/update/:detailId', Authorization, checkPermission('EDIT_DOC_DETAIL'), controller.updateMasterDocDetails);
router.get('/:detailId', Authorization, checkPermission(['LIST_DOC_DETAIL', 'ENTER_RESULT']), controller.getMasterListDocDetailsById);

module.exports = router;
