const express = require('express');
const router = express.Router();

// Main landing page
router.get('/', (req, res) => {
  res.render('landing', { 
    title: 'UGO - Student Transportation System',
    message: 'A comprehensive, modular transportation management system with advanced features for ride-sharing, fleet management, and real-time tracking.'
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Clean routes - no user management conflicts
module.exports = router;
