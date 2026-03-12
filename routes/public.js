const express = require('express');
const router = express.Router();

// Public pages
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

// User management routes (from Phase 2)
router.use('/', require('../modules/user-management/routes/web'));

module.exports = router;
