const express = require('express');
const router = express.Router();
const controller = require('../controllers/steganographyController');

// POST /stenography/watermark/:companyId
router.post('/watermark/:companyId', controller.watermark);

// POST /stenography/detect
router.post('/detect', controller.detect);

router.post('/imagestegonography', controller.onfidoSimulation);
router.post('/detectimage', controller.detectImageSteganography);
router.post('/testimage', controller.testSteganography);
router.get('/downloadimage', controller.getLatestImage);

module.exports = router;
