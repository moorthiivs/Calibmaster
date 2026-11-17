const express = require('express');
const router = express.Router();
const Authorization = require('../middleware/check-auth');
const checkPermission = require('../middleware/check-permission');
const masterListDocController = require('../controllers/Document-list-controller');

// Master Doc List routes — granular CRUD permissions
router.post('/create', Authorization, checkPermission('CREATE_MASTER_DOC'), masterListDocController.createMasterListDoc);
router.get('/fetchAll', Authorization, checkPermission(['LIST_MASTER_DOC', 'ENTER_RESULT']), masterListDocController.fecthAllMasterListDoc);
router.put('/update/:mslId', Authorization, checkPermission('EDIT_MASTER_DOC'), masterListDocController.updateMasterListDoc);
router.get('/:mslId', Authorization, checkPermission(['LIST_MASTER_DOC', 'ENTER_RESULT']), masterListDocController.getMasterListDocById);

module.exports = router;
