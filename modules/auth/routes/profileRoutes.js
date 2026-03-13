const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/ProfileController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Meron Haile Gebremedhin"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   area:
 *                     type: string
 *               photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid name or image
 */
router.put('/profile', ProfileController.updateProfile);

/**
 * @swagger
 * /api/users/phone/change:
 *   post:
 *     summary: Request phone number change
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_phone
 *               - password
 *             properties:
 *               new_phone:
 *                 type: string
 *                 example: "0912345678"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: OTP sent to new phone
 *       400:
 *         description: Phone exists or wrong password
 */
router.post('/phone/change', ProfileController.requestPhoneChange);

/**
 * @swagger
 * /api/users/phone/verify:
 *   post:
 *     summary: Verify new phone number with OTP
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_phone
 *               - otp
 *             properties:
 *               new_phone:
 *                 type: string
 *                 example: "0912345678"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone number updated
 *       400:
 *         description: Invalid OTP
 */
router.post('/phone/verify', ProfileController.verifyPhoneChange);

module.exports = router;
