const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const ParentChildController = require('../controllers/ParentChildController');
const AuthMiddleware = require('../../../core/middleware/auth');

// Public Routes (Views)
router.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Register - UGO Transportation System' 
  });
});

router.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Login - UGO Transportation System' 
  });
});

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { 
    title: 'Forgot Password - UGO Transportation System' 
  });
});

// Protected Routes (Views)
router.get('/dashboard',
  AuthMiddleware.authenticate,
  (req, res) => {
    const user = req.user;
    let dashboardView = 'dashboard';
    
    // Redirect to specific dashboard based on user type
    if (user.userType === 'admin') {
      return res.redirect('/admin');
    } else if (user.userType === 'driver') {
      return res.redirect('/driver');
    } else if (user.userType === 'customer') {
      if (user.customerType === 'parent') {
        return res.redirect('/parent');
      } else if (user.customerType === 'student') {
        return res.redirect('/student');
      } else {
        return res.redirect('/customer');
      }
    }
    
    res.render(dashboardView, { 
      title: 'Dashboard - UGO Transportation System',
      user: user
    });
  }
);

router.get('/profile',
  AuthMiddleware.authenticate,
  (req, res) => {
    res.render('profile', { 
      title: 'My Profile - UGO Transportation System',
      user: req.user
    });
  }
);

// Parent-specific routes
router.get('/parent',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeCustomerType('parent'),
  (req, res) => {
    res.render('parent/dashboard', { 
      title: 'Parent Dashboard - UGO Transportation System',
      user: req.user
    });
  }
);

router.get('/parent/children',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeCustomerType('parent'),
  (req, res) => {
    res.render('parent/children', { 
      title: 'My Children - UGO Transportation System',
      user: req.user
    });
  }
);

// Student-specific routes
router.get('/student',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeCustomerType('student'),
  (req, res) => {
    res.render('student/dashboard', { 
      title: 'Student Dashboard - UGO Transportation System',
      user: req.user
    });
  }
);

// Customer routes
router.get('/customer',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeCustomerType('regular'),
  (req, res) => {
    res.render('customer/dashboard', { 
      title: 'Customer Dashboard - UGO Transportation System',
      user: req.user
    });
  }
);

// Driver routes
router.get('/driver',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize('driver'),
  (req, res) => {
    res.render('driver/dashboard', { 
      title: 'Driver Dashboard - UGO Transportation System',
      user: req.user
    });
  }
);

// Admin routes are now handled by admin-simple.js

module.exports = router;
