const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const steganographyRoutes = require('./steganographyRoutes');
const cibilRoutes = require('./cibilRoutes');
const baitDashRoutes = require('./baitDashRoutes');

// Authentication routes
router.use('/auth', authRoutes);

// Steganography routes
router.use('/steganography', steganographyRoutes);

// user
router.use('/user', cibilRoutes);

// admin
router.use('/admin', baitDashRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;