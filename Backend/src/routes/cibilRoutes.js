const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  simulateCibilScore,
  getAllBaitRecords,
  simulateDataLeak
} = require('../controllers/CibilScoreSimulator');

// @desc    Simulate CIBIL score request
// @route   POST /api/v1/cibil/simulate-score
// @access  Private (User)
router.post('/simulate-score', authMiddleware, simulateCibilScore);


module.exports = router;