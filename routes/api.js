const express = require('express');
const router = express.Router();

// API health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'UGO API is running',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      health: '/api/health'
    }
  });
});

// NOTE: Auth routes are mounted directly in app.js at /api/auth
// to avoid conflicts. Do NOT add /auth routes here.

module.exports = router;
