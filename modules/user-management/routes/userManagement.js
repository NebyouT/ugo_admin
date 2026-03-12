const express = require('express');
const router = express.Router();
const UserManagementController = require('../controllers/UserManagementController');
const { authenticate, adminOnly } = require('../../auth/middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(adminOnly);

// User Management Routes

// Get all users with filtering and pagination
router.get('/', UserManagementController.getUsers);

// Get user statistics
router.get('/stats', UserManagementController.getUserStats);

// Get customers only
router.get('/customers', UserManagementController.getCustomers);

// Get drivers only
router.get('/drivers', UserManagementController.getDrivers);

// Get user by ID
router.get('/:id', UserManagementController.getUserById);

// Create new user
router.post('/', UserManagementController.createUser);

// Update user
router.put('/:id', UserManagementController.updateUser);

// Delete user (soft delete)
router.delete('/:id', UserManagementController.deleteUser);

// Toggle user status (activate/deactivate)
router.patch('/:id/toggle-status', UserManagementController.toggleUserStatus);

module.exports = router;
