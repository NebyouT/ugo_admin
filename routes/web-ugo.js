const express = require('express');
const router = express.Router();

// Public routes
router.get('/', (req, res) => {
  res.render('landing-ugo', { 
    title: 'UGO - Student Transportation System'
  });
});

router.get('/admin-login-ugo', (req, res) => {
  res.render('admin-login-ugo', { 
    title: 'Admin Login - UGO'
  });
});

router.get('/admin', (req, res) => {
  // Check if user is logged in
  const token = req.cookies?.authToken || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.redirect('/admin-login-ugo');
  }
  
  // For now, render with mock user data
  const user = { firstName: 'Admin', lastName: 'User', role: 'admin' };
  res.render('admin-dashboard-ugo', { 
    title: 'Admin Dashboard - UGO',
    user: user
  });
});

// Static pages
router.get('/about-us', (req, res) => {
  res.render('about-ugo', { 
    title: 'About Us - UGO'
  });
});

router.get('/contact-us', (req, res) => {
  res.render('contact-ugo', { 
    title: 'Contact Us - UGO'
  });
});

router.get('/privacy', (req, res) => {
  res.render('privacy-ugo', { 
    title: 'Privacy Policy - UGO'
  });
});

router.get('/terms', (req, res) => {
  res.render('terms-ugo', { 
    title: 'Terms & Conditions - UGO'
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// User management routes
router.use('/', require('../modules/user-management/routes/web'));

module.exports = router;
