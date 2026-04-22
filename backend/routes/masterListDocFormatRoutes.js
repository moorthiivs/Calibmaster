const express = require('express');
const router = express.Router();
const Authorization = require('../middleware/check-auth');
const checkPermission = require('../middleware/check-permission');
const controller = require('../controllers/Document-format-controller');

// Master Doc Format routes — granular CRUD permissions
router.post('/create', Authorization, checkPermission('CREATE_DOC_FORMAT'), controller.createDocFormat);
router.get('/fetchAll', Authorization, checkPermission(['LIST_DOC_FORMAT', 'ENTER_RESULT']), controller.getAllDocFormat);
router.get('/:formatId', Authorization, checkPermission(['LIST_DOC_FORMAT', 'ENTER_RESULT']), controller.getDocumentFormatById);
router.put('/update/:formatId', Authorization, checkPermission('EDIT_DOC_FORMAT'), controller.updateMasterDocFormat);

module.exports = router;
