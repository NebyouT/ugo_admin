const express = require('express');
const router = express.Router();
const { webAuthenticate, webAdminOnly } = require('../modules/auth/middleware/webAuth');
const User = require('../modules/user-management/models/User');

// Initialize admin user if not exists
User.createAdminIfNotExists();

// ============================================
// PUBLIC ROUTES
// ============================================

// Login page
router.get('/login', (req, res) => {
  if (req.cookies?.adminAuth) {
    return res.redirect('/admin');
  }
  res.render('login', { title: 'Admin Login - UGO' });
});

// Login POST - returns JSON
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findByCredentials(email, password);
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const token = user.generateAuthToken();
    res.cookie('adminAuth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    user.lastLoginAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    let statusCode = 401;
    let message = 'Invalid email or password';
    if (error.message.includes('not active')) { statusCode = 403; message = 'Account is not active.'; }
    return res.status(statusCode).json({ success: false, message });
  }
});

// Auth check
router.get('/auth/check', (req, res) => {
  res.json({
    success: !!req.cookies?.adminAuth,
    data: { authenticated: !!req.cookies?.adminAuth }
  });
});

// ============================================
// PROTECTED ROUTES (require login)
// ============================================

// Dashboard
router.get('/', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/dashboard/index', {
    title: 'Dashboard - UGO Admin',
    user: req.user,
    currentPath: '/'
  });
});

// All Users
router.get('/users', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/users/index', {
    title: 'All Users - UGO Admin',
    user: req.user,
    currentPath: '/users'
  });
});

// Parents (filtered customers view)
router.get('/parents', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/users/index', {
    title: 'Parents - UGO Admin',
    user: req.user,
    currentPath: '/parents',
    filterUserType: 'customer'
  });
});

// Drivers
router.get('/drivers', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/drivers/index', {
    title: 'Drivers - UGO Admin',
    user: req.user,
    currentPath: '/drivers'
  });
});

// API Documentation
router.get('/api-docs', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/api-docs/index', {
    title: 'API Documentation - UGO Admin',
    user: req.user,
    currentPath: '/api-docs'
  });
});

module.exports = router;
