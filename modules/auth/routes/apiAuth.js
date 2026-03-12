const express = require('express');
const router = express.Router();
const ApiAuthController = require('../controllers/ApiAuthController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to protected routes
router.use(authenticate);

// Public routes (no authentication required)

// Register new user
router.post('/register', ApiAuthController.register);

// Login user
router.post('/login', ApiAuthController.login);

// Forgot password
router.post('/forgot-password', ApiAuthController.forgotPassword);

// Reset password
router.post('/reset-password', ApiAuthController.resetPassword);

// Verify OTP
router.post('/verify-otp', ApiAuthController.verifyOTP);

// Refresh token
router.post('/refresh-token', ApiAuthController.refreshToken);

// Resend OTP
router.post('/resend-otp', ApiAuthController.resendOTP);

// Protected routes (authentication required)

// Logout user
router.post('/logout', ApiAuthController.logout);

// Get current user
router.get('/me', ApiAuthController.getCurrentUser);

// Change password (logged in user)
router.post('/change-password', ApiAuthController.changePassword);

// Delete account
router.delete('/account', ApiAuthController.deleteAccount);

module.exports = router;
