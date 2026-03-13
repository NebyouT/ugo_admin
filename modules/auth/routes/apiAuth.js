const express = require('express');
const router = express.Router();
const ApiAuthController = require('../controllers/ApiAuthController');
const { authenticate } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

// 1. Register new user (parent or driver)
router.post('/register', ApiAuthController.register);

// 2. Login user
router.post('/login', ApiAuthController.login);

// 4. Forgot password - request OTP
router.post('/forgot-password', ApiAuthController.forgotPassword);

// 5. Reset password with OTP
router.post('/reset-password', ApiAuthController.resetPassword);

// 6. Verify OTP code
router.post('/verify-otp', ApiAuthController.verifyOTP);

// 7. Refresh access token
router.post('/refresh-token', ApiAuthController.refreshToken);

// 9. Resend OTP
router.post('/resend-otp', ApiAuthController.resendOTP);

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

// 3. Logout user
router.post('/logout', authenticate, ApiAuthController.logout);

// 8. Get current user profile
router.get('/me', authenticate, ApiAuthController.getCurrentUser);

// 10. Change password (logged in user)
router.post('/change-password', authenticate, ApiAuthController.changePassword);

// 11. Delete account
router.delete('/account', authenticate, ApiAuthController.deleteAccount);

module.exports = router;
