const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes - JWT authentication middleware
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Also check Authorization header for API calls
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's a fallback admin token
      if (decoded.id === 'admin-fallback') {
        req.user = {
          id: 'admin-fallback',
          email: process.env.ADMIN_EMAIL,
          firstName: process.env.ADMIN_FIRST_NAME,
          lastName: process.env.ADMIN_LAST_NAME,
          fullName: `${process.env.ADMIN_FIRST_NAME} ${process.env.ADMIN_LAST_NAME}`,
          role: 'admin'
        };
        return next();
      }

      // Find user from database
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.'
        });
      }

      // Attach user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });
  }
};

// @desc    Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

// @desc    Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in cookies or headers
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's a fallback admin token
      if (decoded.id === 'admin-fallback') {
        req.user = {
          id: 'admin-fallback',
          email: process.env.ADMIN_EMAIL,
          firstName: process.env.ADMIN_FIRST_NAME,
          lastName: process.env.ADMIN_LAST_NAME,
          fullName: `${process.env.ADMIN_FIRST_NAME} ${process.env.ADMIN_LAST_NAME}`,
          role: 'admin'
        };
        return next();
      }

      // Find user from database
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      } else {
        req.user = null;
      }

      next();

    } catch (jwtError) {
      // Invalid token, continue without authentication
      req.user = null;
      next();
    }

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};
