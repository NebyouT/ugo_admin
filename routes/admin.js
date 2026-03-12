const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../modules/auth/middleware/auth');
const { webAuthenticate, webAdminOnly } = require('../modules/auth/middleware/webAuth');
const User = require('../modules/auth/models/User');

// Initialize admin user if not exists
User.createAdminIfNotExists();

// Admin login page
router.get('/login', (req, res) => {
  // If user is already logged in, redirect to dashboard
  if (req.cookies?.adminAuth) {
    return res.redirect('/admin');
  }
  
  res.render('login', { 
    title: 'Admin Login - UGO'
  });
});

// Admin login API - Use auth module
router.post('/auth/login', require('../modules/auth/routes/auth'));

// Admin dashboard (protected)
router.get('/', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/dashboard/index', { 
    title: 'Admin Dashboard - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// User Management page (protected)
router.get('/users', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/users/index', { 
    title: 'User Management - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// Vehicles page (protected)
router.get('/vehicles', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/vehicles/index', { 
    title: 'Vehicle Management - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// Trips page (protected)
router.get('/trips', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/trips/index', { 
    title: 'Trip Management - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// Parents page (protected)
router.get('/parents', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/parents/index', { 
    title: 'Parent Management - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// Students page (protected)
router.get('/students', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/students/index', { 
    title: 'Student Management - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// Drivers page (protected)
router.get('/drivers', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/drivers/index', { 
    title: 'Driver Management - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// Customers page (protected)
router.get('/customers', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/customers/index', { 
    title: 'Customer Management - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// API Documentation page (protected)
router.get('/api-docs', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/api-docs/index', { 
    title: 'API Documentation - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// Settings page (protected)
router.get('/settings', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/settings/index', { 
    title: 'Settings - UGO',
    user: req.user,
    currentPath: req.path
  });
});

// Logout - Use auth module
router.post('/auth/logout', require('../modules/auth/routes/auth'));

// API routes for authentication
router.use('/auth', require('../modules/auth/routes/auth'));

module.exports = router;
