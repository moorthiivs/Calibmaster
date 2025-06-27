const express = require('express');
const router = express.Router();
const controller = require('../controllers/Document-format-controller');


router.post('/create', controller.createDocFormat);
router.get('/fetchAll', controller.getAllDocFormat);
router.get('/:formatId', controller.getDocumentFormatById);
router.put('/update/:formatId', controller.updateMasterDocFormat);
module.exports = router;
