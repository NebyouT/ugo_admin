const express = require('express');
const router = express.Router();
const ApiAuthController = require('../controllers/ApiAuthController');
const { authenticate } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (parent or driver)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, phone, password, userType]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Meron"
 *               lastName:
 *                 type: string
 *                 example: "Haile"
 *               phone:
 *                 type: string
 *                 example: "+251911234567"
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               userType:
 *                 type: string
 *                 enum: [customer, driver]
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful, OTP sent
 *       400:
 *         description: Phone already registered
 */
router.post('/register', ApiAuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with phone and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+251911234567"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', ApiAuthController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+251911234567"
 *     responses:
 *       200:
 *         description: OTP sent to phone
 *       404:
 *         description: Phone not found
 */
router.post('/forgot-password', ApiAuthController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp, newPassword]
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP
 */
router.post('/reset-password', ApiAuthController.resetPassword);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp, purpose]
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 enum: [registration, login, password_reset]
 *     responses:
 *       200:
 *         description: OTP verified, returns token
 *       400:
 *         description: Invalid OTP
 */
router.post('/verify-otp', ApiAuthController.verifyOTP);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens returned
 *       400:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', ApiAuthController.refreshToken);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP to phone
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, purpose]
 *             properties:
 *               phone:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [registration, login, password_reset]
 *     responses:
 *       200:
 *         description: OTP resent
 */
router.post('/resend-otp', ApiAuthController.resendOTP);

// ============================================
// PROTECTED ROUTES (authentication required)
// ============================================

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', authenticate, ApiAuthController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, ApiAuthController.getCurrentUser);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password (logged in user)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Current password incorrect
 */
router.post('/change-password', authenticate, ApiAuthController.changePassword);

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Delete account
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/account', authenticate, ApiAuthController.deleteAccount);

module.exports = router;
