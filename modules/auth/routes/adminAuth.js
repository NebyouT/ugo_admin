const express = require('express');
const router = express.Router();
const AdminAuthController = require('../controllers/AdminAuthController');
const { authenticate, adminOnly } = require('../middleware/auth');

// Apply authentication and admin middleware to all routes
router.use(authenticate);
router.use(adminOnly);

// Authentication statistics
router.get('/stats', AdminAuthController.getAuthStats);

// Pending verifications
router.get('/pending-verifications', AdminAuthController.getPendingVerifications);

// Active sessions
router.get('/active-sessions', AdminAuthController.getActiveSessions);

// Authentication timeline
router.get('/timeline', AdminAuthController.getAuthTimeline);

// Manual OTP generation
router.post('/generate-otp', AdminAuthController.generateManualOTP);

// User verification management
router.post('/verify/:userId/approve', AdminAuthController.approveVerification);
router.post('/verify/:userId/reject', AdminAuthController.rejectVerification);
router.post('/verify/:userId/resend-otp', AdminAuthController.resendOTP);

// Session management
router.post('/session/:userId/terminate', AdminAuthController.terminateSession);

// User authentication details
router.get('/user/:userId/details', AdminAuthController.getUserAuthDetails);

// Bulk operations
router.post('/bulk/approve-verifications', AdminAuthController.bulkApproveVerifications);
router.post('/bulk/reject-verifications', AdminAuthController.bulkRejectVerifications);
router.post('/bulk/terminate-sessions', AdminAuthController.bulkTerminateSessions);

module.exports = router;
