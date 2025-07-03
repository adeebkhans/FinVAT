const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  generateProfile,
  getAllUsers,
  updateUserRole
} = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/generate-profile', authMiddleware, generateProfile);

// Admin only routes
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
router.put('/users/:userId/role', authMiddleware, adminMiddleware, updateUserRole);

module.exports = router;
