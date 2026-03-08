const express = require('express');
const { protect } = require('../middleware/auth');
const {
  adminLogin,
  adminLogout,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  getDashboardStats
} = require('../controllers/admin/adminController');

const router = express.Router();

// @desc    Admin login page
// @route   GET /admin
router.get('/', (req, res) => {
  res.render('admin/login', { 
    title: 'Admin Login - UGO System' 
  });
});

// @desc    Admin dashboard page
// @route   GET /admin/dashboard
router.get('/dashboard', protect, (req, res) => {
  res.render('admin/dashboard', { 
    title: 'Dashboard - UGO Admin', 
    user: req.user 
  });
});

// @desc    Admin login API
// @route   POST /api/admin/login
// @access  Public
router.post('/login', adminLogin);

// @desc    Admin logout API
// @route   POST /api/admin/logout
// @access  Private
router.post('/logout', protect, adminLogout);

// @desc    Get admin profile API
// @route   GET /api/admin/me
// @access  Private
router.get('/me', protect, getAdminProfile);

// @desc    Update admin profile API
// @route   PUT /api/admin/me
// @access  Private
router.put('/me', protect, updateAdminProfile);

// @desc    Change password API
// @route   PUT /api/admin/change-password
// @access  Private
router.put('/change-password', protect, changePassword);

// @desc    Get dashboard statistics API
// @route   GET /api/admin/dashboard/stats
// @access  Private
router.get('/dashboard/stats', protect, getDashboardStats);

module.exports = router;
