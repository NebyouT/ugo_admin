const express = require('express');
const router = express.Router();

// API health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'UGO API is running',
    version: '1.0.0'
  });
});

// User Management Routes
router.use('/auth', require('../modules/user-management/routes/auth'));

// Placeholder for future API routes
// Vehicle Management routes will be added here
// router.use('/vehicles', require('./modules/vehicle-management/routes'));

// Trip Management routes will be added here
// router.use('/trips', require('./modules/trip-management/routes'));

module.exports = router;
