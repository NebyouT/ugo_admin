const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../../modules/user-management/models/User');
const { formatResponse } = require('../utils/helpers');

class AuthMiddleware {
  /**
   * Generate JWT Token
   */
  static generateToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      userType: user.userType,
      customerType: user.customerType,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  /**
   * Generate Refresh Token
   */
  static generateRefreshToken(user) {
    const payload = {
      id: user._id,
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  }

  /**
   * Verify JWT Token
   */
  static async verifyToken(token) {
    return promisify(jwt.verify)(token, process.env.JWT_SECRET);
  }

  /**
   * Authentication Middleware
   */
  static async authenticate(req, res, next) {
    try {
      // Get token from header or cookie
      let token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        token = req.cookies?.authToken;
      }

      if (!token) {
        return res.status(401).json(
          formatResponse(false, 'Access denied. No token provided.')
        );
      }

      // Verify token
      const decoded = await this.verifyToken(token);
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json(
          formatResponse(false, 'Invalid token. User not found.')
        );
      }

      if (!user.isActive) {
        return res.status(401).json(
          formatResponse(false, 'Account is deactivated.')
        );
      }

      if (user.isTempBlocked && user.tempBlockedUntil > new Date()) {
        return res.status(401).json(
          formatResponse(false, 'Account is temporarily blocked.')
        );
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json(
          formatResponse(false, 'Invalid token.')
        );
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(
          formatResponse(false, 'Token expired.')
        );
      }

      console.error('Authentication error:', error);
      return res.status(500).json(
        formatResponse(false, 'Server error during authentication.')
      );
    }
  }

  /**
   * Role-based Authorization Middleware
   */
  static authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json(
          formatResponse(false, 'Authentication required.')
        );
      }

      const userRole = req.user.role;
      const userType = req.user.userType;
      
      // Check if user has required role
      const hasRole = allowedRoles.includes(userRole) || allowedRoles.includes(userType);
      
      if (!hasRole) {
        return res.status(403).json(
          formatResponse(false, 'Insufficient permissions.')
        );
      }

      next();
    };
  }

  /**
   * Customer Type Authorization (for enhanced customer logic)
   */
  static authorizeCustomerType(...allowedTypes) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json(
          formatResponse(false, 'Authentication required.')
        );
      }

      if (req.user.userType !== 'customer') {
        return res.status(403).json(
          formatResponse(false, 'Access denied. Customer role required.')
        );
      }

      const customerType = req.user.customerType;
      
      if (!allowedTypes.includes(customerType)) {
        return res.status(403).json(
          formatResponse(false, 'Insufficient customer type permissions.')
        );
      }

      next();
    };
  }

  /**
   * Parent-Child Relationship Authorization
   */
  static async authorizeParentChildAccess(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json(
          formatResponse(false, 'Authentication required.')
        );
      }

      const { childId } = req.params;
      
      // If user is admin, allow access
      if (req.user.role === 'admin') {
        return next();
      }

      // If user is a parent, check if they have access to this child
      if (req.user.customerType === 'parent') {
        const ParentChildRelationship = require('../../modules/user-management/models/ParentChildRelationship');
        
        const relationship = await ParentChildRelationship.findOne({
          parent: req.user._id,
          child: childId,
          isActive: true
        });

        if (!relationship) {
          return res.status(403).json(
            formatResponse(false, 'Access denied. No parent-child relationship found.')
          );
        }

        req.parentChildRelationship = relationship;
        return next();
      }

      // If user is trying to access their own data (as a student)
      if (req.user.customerType === 'student' && req.user._id.toString() === childId) {
        return next();
      }

      return res.status(403).json(
        formatResponse(false, 'Access denied.')
      );
    } catch (error) {
      console.error('Parent-Child authorization error:', error);
      return res.status(500).json(
        formatResponse(false, 'Server error during authorization.')
      );
    }
  }

  /**
   * Optional Authentication (doesn't fail if no token)
   */
  static async optionalAuth(req, res, next) {
    try {
      let token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        token = req.cookies?.authToken;
      }

      if (token) {
        const decoded = await this.verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive && !user.isTempBlocked) {
          req.user = user;
        }
      }

      next();
    } catch (error) {
      // Don't fail, just continue without user
      next();
    }
  }

  /**
   * Rate Limiting for Authentication
   */
  static authRateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const attempts = new Map();

    return (req, res, next) => {
      const key = req.ip + req.body.email;
      const now = Date.now();
      const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };

      if (now > userAttempts.resetTime) {
        userAttempts.count = 0;
        userAttempts.resetTime = now + windowMs;
      }

      userAttempts.count++;
      attempts.set(key, userAttempts);

      if (userAttempts.count > maxAttempts) {
        return res.status(429).json(
          formatResponse(false, 'Too many authentication attempts. Please try again later.')
        );
      }

      next();
    };
  }

  /**
   * Set Authentication Cookie
   */
  static setAuthCookie(res, token) {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.cookie('authToken', token, cookieOptions);
  }

  /**
   * Clear Authentication Cookie
   */
  static clearAuthCookie(res) {
    res.clearCookie('authToken');
  }
}

module.exports = AuthMiddleware;
