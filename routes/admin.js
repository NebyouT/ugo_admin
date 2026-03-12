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

// Admin login POST - Web-friendly login with redirect
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Import User model and AuthController
    const User = require('../modules/user-management/models/User');
    
    // Find user by credentials
    const user = await User.findByCredentials(email, password);

    // Generate JWT token
    const token = user.generateAuthToken();

    // Set HTTP-only cookie with token
    res.cookie('adminAuth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Log successful login
    console.log(`User logged in: ${email} (${user.role}) at ${new Date().toISOString()}`);

    // Check if this is an AJAX request (JSON expected)
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.json({
        success: true,
        message: 'Login successful',
        redirect: '/admin',
        data: {
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            userType: user.userType
          }
        }
      });
    }

    // For regular form submissions, redirect to dashboard
    res.redirect('/admin');

  } catch (error) {
    console.error('Login error:', error.message);
    
    // Return appropriate error message
    let statusCode = 500;
    let message = 'Login failed';

    if (error.message.includes('Invalid credentials')) {
      statusCode = 401;
      message = 'Invalid email or password';
    } else if (error.message.includes('Account is temporarily locked')) {
      statusCode = 423;
      message = 'Account temporarily locked due to multiple failed attempts. Please try again later.';
    } else if (error.message.includes('Account is not active')) {
      statusCode = 403;
      message = 'Account is not active. Please contact administrator.';
    }

    // Check if this is an AJAX request
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
      return res.status(statusCode).json({
        success: false,
        message: message
      });
    }

    // For regular form submissions, render login page with error
    res.status(statusCode).render('login', { 
      title: 'Admin Login - UGO',
      error: message
    });
  }
});

// Auth check endpoint for JavaScript
router.get('/auth/check', (req, res) => {
  if (req.cookies?.adminAuth) {
    return res.json({
      success: true,
      message: 'User is authenticated',
      data: {
        authenticated: true
      }
    });
  }
  
  res.json({
    success: false,
    message: 'User not authenticated',
    data: {
      authenticated: false
    }
  });
});

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

// Authentication Management page (protected)
router.get('/auth-management', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/auth-management/index', { 
    title: 'Authentication Management - UGO',
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
