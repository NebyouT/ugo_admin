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
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('adminAuth', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
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

// Parents (dedicated parent management view)
router.get('/parents', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/parents/index', {
    title: 'Parent Management - UGO Admin',
    user: req.user,
    currentPath: '/parents'
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

// Children Management
router.get('/children', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/children/index', {
    title: 'Children Management - UGO Admin',
    user: req.user,
    currentPath: '/children'
  });
});

// Parent Children Management
router.get('/parents/children', webAuthenticate, (req, res) => {
  res.render('admin/views/parents/children', {
    title: 'My Children - UGO Admin',
    user: req.user,
    currentPath: '/parents/children'
  });
});

// Parent Management
router.get('/parents', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/parents/index', {
    title: 'Parent Management - UGO Management',
    user: req.user,
    currentPath: '/parents'
  });
});

// Profile Settings
router.get('/profile', webAuthenticate, (req, res) => {
  res.render('admin/views/profile/index', {
    title: 'Profile Settings - UGO Admin',
    user: req.user,
    currentPath: '/profile'
  });
});

// Integrations (3rd Party Services)
router.get('/integrations', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/integrations/index', {
    title: 'Third-Party Integrations - UGO Admin',
    user: req.user,
    currentPath: '/integrations'
  });
});

// Schools Management
router.get('/schools', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/schools/index', {
    title: 'Schools Management - UGO Admin',
    user: req.user,
    currentPath: '/schools'
  });
});

// Groups Management
router.get('/groups', webAuthenticate, webAdminOnly, async (req, res) => {
  let schools = []; // Always define schools as empty array first
  
  try {
    console.log('Loading schools for groups page...');
    
    // Pre-load schools for the form
    const School = require('../modules/schools/models/School');
    schools = await School.find({ isDeleted: false, isActive: true })
      .select('name address city _id')
      .sort({ name: 1 });
    
    console.log(`Found ${schools.length} schools for groups page`);
    
    res.render('admin/views/groups/index', {
      title: 'Groups Management - UGO Admin',
      user: req.user,
      currentPath: '/groups',
      schools: schools // Always pass schools (could be empty array)
    });
  } catch (error) {
    console.error('Error loading schools for groups page:', error);
    // Ensure schools is defined even on error
    schools = [];
    
    res.render('admin/views/groups/index', {
      title: 'Groups Management - UGO Admin',
      user: req.user,
      currentPath: '/groups',
      schools: schools // Pass empty array on error
    });
  }
});

// Zones Management
router.get('/zones', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/zones/index', {
    title: 'Zones Management - UGO Admin',
    user: req.user,
    currentPath: '/zones'
  });
});

router.get('/zones/create', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/zones/create', {
    title: 'Create Zone - UGO Admin',
    user: req.user,
    currentPath: '/zones'
  });
});

router.get('/zones/view/:id', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/zones/view', {
    title: 'Zone Details - UGO Admin',
    user: req.user,
    currentPath: '/zones'
  });
});

router.get('/zones/edit/:id', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/zones/edit', {
    title: 'Edit Zone - UGO Admin',
    user: req.user,
    currentPath: '/zones'
  });
});

// Google Maps API key endpoint for frontend
router.get('/integrations/google-maps/key', webAuthenticate, webAdminOnly, async (req, res) => {
  try {
    const GoogleMapsService = require('../modules/integrations/services/GoogleMapsService');
    const apiKey = await GoogleMapsService.getAPIKey();
    
    res.json({
      success: true,
      data: {
        apiKey: apiKey
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
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
