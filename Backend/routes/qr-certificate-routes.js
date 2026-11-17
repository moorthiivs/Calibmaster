const express = require('express');
const router = express.Router();
const qrCertificateController = require('../controllers/qr-certificate-controller');
const checkAuth = require('../middleware/check-auth');

router.get('/certificate/:token', qrCertificateController.renderCertificatePage);
router.get('/download/:token', qrCertificateController.downloadCertificate);

// Protected endpoints (used by frontend application)
router.post('/generate-token', checkAuth, qrCertificateController.generateToken);
router.post('/equipments', checkAuth, qrCertificateController.getUniqueEquipments);

module.exports = router;
