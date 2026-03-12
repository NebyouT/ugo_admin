const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { webOptionalAuth } = require('../middleware/webAuth');

// Public routes (no authentication required)

// Login
router.post('/login', AuthController.login);

// Forgot password
router.post('/forgot-password', AuthController.forgotPassword);

// Reset password
router.post('/reset-password', AuthController.resetPassword);

// Web-friendly auth check (for frontend JavaScript)
router.get('/check', webOptionalAuth, AuthController.checkAuth);

// Protected routes (authentication required)

// Logout
router.post('/logout', authenticate, AuthController.logout);

// Get current user profile
router.get('/profile', authenticate, AuthController.getProfile);

// Update profile
router.put('/profile', authenticate, AuthController.updateProfile);

// Change password
router.put('/change-password', authenticate, AuthController.changePassword);

module.exports = router;
