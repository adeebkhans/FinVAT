const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const steganographyRoutes = require('./steganography');

// Authentication routes
router.use('/auth', authRoutes);

// Steganography routes
router.use('/steganography', steganographyRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;