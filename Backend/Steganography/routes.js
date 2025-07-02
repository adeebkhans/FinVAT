const express = require('express');
const router = express.Router();
const controller = require('./SteganographyController');

// POST /stenography/watermark/:companyId
router.post('/watermark/:companyId', controller.watermark);

// POST /stenography/detect
router.post('/detect', controller.detect);

module.exports = router;
