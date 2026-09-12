const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getMe,
  updateTheme,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateAuthInput } = require('../middleware/validate');

// Public auth routes
router.post('/signup', validateAuthInput(true), signup);
router.post('/register', validateAuthInput(true), signup);
router.post('/login', validateAuthInput(false), login);
router.post('/logout', logout);

// Protected user routes
router.get('/me', protect, getMe);
router.patch('/theme', protect, updateTheme);
router.patch('/profile', protect, updateProfile);

module.exports = router;
