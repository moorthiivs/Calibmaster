const express = require('express');
const router = express.Router();
const masterListDocController = require('../controllers/Document-list-controller');

router.post('/create', masterListDocController.createMasterListDoc);
router.get('/fetchAll', masterListDocController.fecthAllMasterListDoc);
router.put('/update/:mslId', masterListDocController.updateMasterListDoc);
router.get('/:mslId', masterListDocController.getMasterListDocById);

module.exports = router;
