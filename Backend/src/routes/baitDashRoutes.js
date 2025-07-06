const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  leakData,
  getDashboardStats
} = require('../controllers/BaitDashboardController');

// @desc    Simulate data leak and download JSON file
// @route   GET /api/v1/bait/leak/:company
// @access  Private (Admin only)
router.get('/leak/:company', authMiddleware, adminMiddleware, leakData);

// @desc    Get dashboard statistics
// @route   GET /api/v1/bait/dashboard-stats
// @access  Private (Admin only)
router.get('/dashboard-stats', authMiddleware, adminMiddleware, getDashboardStats);

module.exports = router;