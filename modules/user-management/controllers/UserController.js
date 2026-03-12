const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ParentChildRelationship = require('../models/ParentChildRelationship');
const { UserAccount, UserLevel } = require('../models/UserRelated');
const AuthMiddleware = require('../../../core/middleware/auth');
const { formatResponse } = require('../../../core/utils/helpers');

class UserController {
  /**
   * User Registration
   */
  static registerValidation = [
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters'),
    
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters'),
    
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    
    body('phone')
      .isMobilePhone()
      .withMessage('Valid phone number required'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    
    body('userType')
      .isIn(['customer', 'driver'])
      .withMessage('User type must be customer or driver'),
    
    body('customerType')
      .if(body('userType').equals('customer'))
      .isIn(['regular', 'student', 'parent'])
      .withMessage('Customer type must be regular, student, or parent')
  ];

  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          formatResponse(false, 'Validation failed', errors.array())
        );
      }

      const { firstName, lastName, email, phone, password, userType, customerType, ...additionalData } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmailOrPhone(email);
      if (existingUser) {
        return res.status(400).json(
          formatResponse(false, 'User with this email already exists')
        );
      }

      // Create user
      const userData = {
        firstName,
        lastName,
        email,
        phone,
        password,
        userType,
        customerType: userType === 'customer' ? customerType || 'regular' : undefined,
        ...additionalData
      };

      // Add customer-specific data
      if (userType === 'customer') {
        if (customerType === 'student' && additionalData.studentInfo) {
          userData.studentInfo = additionalData.studentInfo;
          // Generate student ID if not provided
          if (!userData.studentInfo.studentId) {
            userData.studentInfo.studentId = `STU${Date.now()}`;
          }
        }
        
        if (customerType === 'parent' && additionalData.parentInfo) {
          userData.parentInfo = additionalData.parentInfo;
        }
      }

      // Add driver-specific data
      if (userType === 'driver' && additionalData.driverInfo) {
        userData.driverInfo = additionalData.driverInfo;
      }

      const user = new User(userData);
      await user.save();

      // Generate referral code
      user.generateReferralCode();
      await user.save();

      // Create user account
      const userAccount = new UserAccount({ user: user._id });
      await userAccount.save();

      // Assign default user level
      const defaultLevel = await UserLevel.findOne({ level: 1 });
      if (defaultLevel) {
        user.userLevel = defaultLevel._id;
        await user.save();
      }

      // Generate tokens
      const token = AuthMiddleware.generateToken(user);
      const refreshToken = AuthMiddleware.generateRefreshToken(user);

      // Set auth cookie
      AuthMiddleware.setAuthCookie(res, token);

      // Update user with refresh token
      user.refreshToken = refreshToken;
      await user.save();

      // Return user data without password
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.status(201).json(
        formatResponse(true, 'User registered successfully', {
          user: userResponse,
          token,
          refreshToken
        })
      );
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json(
        formatResponse(false, 'Registration failed', error.message)
      );
    }
  }

  /**
   * User Login
   */
  static loginValidation = [
    body('identifier')
      .notEmpty()
      .withMessage('Email or phone required'),
    
    body('password')
      .notEmpty()
      .withMessage('Password required')
  ];

  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          formatResponse(false, 'Validation failed', errors.array())
        );
      }

      const { identifier, password, rememberMe } = req.body;

      // Find user by email or phone
      const user = await User.findByEmailOrPhone(identifier);
      if (!user) {
        return res.status(401).json(
          formatResponse(false, 'Invalid credentials')
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json(
          formatResponse(false, 'Account is deactivated')
        );
      }

      // Check if user is temporarily blocked
      if (user.isTempBlocked && user.tempBlockedUntil > new Date()) {
        return res.status(401).json(
          formatResponse(false, 'Account is temporarily blocked')
        );
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment failed attempts
        user.failedLoginAttempts += 1;
        
        // Block user after 5 failed attempts
        if (user.failedLoginAttempts >= 5) {
          user.isTempBlocked = true;
          user.tempBlockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }
        
        await user.save();
        
        return res.status(401).json(
          formatResponse(false, 'Invalid credentials')
        );
      }

      // Reset failed attempts on successful login
      user.failedLoginAttempts = 0;
      user.isTempBlocked = false;
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const token = AuthMiddleware.generateToken(user);
      const refreshToken = AuthMiddleware.generateRefreshToken(user);

      // Set auth cookie
      AuthMiddleware.setAuthCookie(res, token);

      // Update user with refresh token
      user.refreshToken = refreshToken;
      await user.save();

      // Return user data without password
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.json(
        formatResponse(true, 'Login successful', {
          user: userResponse,
          token,
          refreshToken
        })
      );
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(
        formatResponse(false, 'Login failed', error.message)
      );
    }
  }

  /**
   * User Logout
   */
  static async logout(req, res) {
    try {
      // Clear refresh token from user
      if (req.user) {
        req.user.refreshToken = null;
        await req.user.save();
      }

      // Clear auth cookie
      AuthMiddleware.clearAuthCookie(res);

      res.json(
        formatResponse(true, 'Logout successful')
      );
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json(
        formatResponse(false, 'Logout failed', error.message)
      );
    }
  }

  /**
   * Get User Profile
   */
  static async getProfile(req, res) {
    try {
      const user = req.user;
      
      // Get user account information
      const userAccount = await UserAccount.findOne({ user: user._id });
      
      // Get parent-child relationships if user is a parent
      let relationships = [];
      if (user.customerType === 'parent') {
        relationships = await ParentChildRelationship.findByParent(user._id);
      }

      // Get parent information if user is a student
      let parentInfo = [];
      if (user.customerType === 'student') {
        parentInfo = await ParentChildRelationship.findByChild(user._id);
      }

      const userProfile = {
        ...user.toJSON(),
        account: userAccount,
        relationships,
        parentInfo
      };

      res.json(
        formatResponse(true, 'Profile retrieved successfully', userProfile)
      );
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to retrieve profile', error.message)
      );
    }
  }

  /**
   * Update User Profile
   */
  static updateProfileValidation = [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters'),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Valid phone number required')
  ];

  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          formatResponse(false, 'Validation failed', errors.array())
        );
      }

      const user = req.user;
      const updates = req.body;

      // Remove sensitive fields
      delete updates.password;
      delete updates.email;
      delete updates.userType;
      delete updates.role;

      // Update user
      Object.assign(user, updates);
      await user.save();

      // Return updated user data
      const userResponse = user.toJSON();
      delete userResponse.password;

      res.json(
        formatResponse(true, 'Profile updated successfully', userResponse)
      );
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to update profile', error.message)
      );
    }
  }

  /**
   * Change Password
   */
  static changePasswordValidation = [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password required'),
    
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters')
  ];

  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          formatResponse(false, 'Validation failed', errors.array())
        );
      }

      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json(
          formatResponse(false, 'Current password is incorrect')
        );
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json(
        formatResponse(true, 'Password changed successfully')
      );
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to change password', error.message)
      );
    }
  }

  /**
   * Refresh Token
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json(
          formatResponse(false, 'Refresh token required')
        );
      }

      // Verify refresh token
      const decoded = await AuthMiddleware.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        return res.status(400).json(
          formatResponse(false, 'Invalid refresh token')
        );
      }

      // Find user
      const user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json(
          formatResponse(false, 'Invalid refresh token')
        );
      }

      // Generate new tokens
      const newToken = AuthMiddleware.generateToken(user);
      const newRefreshToken = AuthMiddleware.generateRefreshToken(user);

      // Update user with new refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      // Set new auth cookie
      AuthMiddleware.setAuthCookie(res, newToken);

      res.json(
        formatResponse(true, 'Token refreshed successfully', {
          token: newToken,
          refreshToken: newRefreshToken
        })
      );
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json(
        formatResponse(false, 'Failed to refresh token', error.message)
      );
    }
  }
}

module.exports = UserController;
