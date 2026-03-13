const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo_admin')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const ApiEndpoint = require('../models/ApiEndpoint');

const authApis = [
  {
    title: 'Register User',
    method: 'POST',
    endpoint: '/api/auth/register',
    description: 'Register a new user (parent or driver) with phone number and OTP verification',
    category: 'Authentication',
    requiresAuth: false,
    order: 1,
    requestBody: {
      firstName: 'string (required)',
      lastName: 'string (required)',
      phone: 'string (required, format: +251XXXXXXXXX)',
      email: 'string (optional)',
      password: 'string (required, min 8 characters)',
      userType: 'string (required: "customer" or "driver")',
      address: 'string (optional)'
    },
    requestExample: JSON.stringify({
      firstName: "John",
      lastName: "Doe",
      phone: "+251912345678",
      email: "john@example.com",
      password: "password123",
      userType: "customer",
      address: "Addis Ababa, Ethiopia"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: 'Registration successful. Please verify your phone.',
      data: {
        userId: 'string',
        phone: 'string',
        otpSent: true
      }
    },
    responseError: {
      success: false,
      message: 'Phone number already registered'
    },
    notes: 'OTP is hardcoded to 123456 for testing. In production, it will be sent via SMS.'
  },
  {
    title: 'Verify OTP',
    method: 'POST',
    endpoint: '/api/auth/verify-otp',
    description: 'Verify phone number with OTP code sent during registration',
    category: 'Authentication',
    requiresAuth: false,
    order: 2,
    requestBody: {
      phone: 'string (required)',
      otp: 'string (required, 6 digits)',
      purpose: 'string (required: "registration", "login", or "password_reset")'
    },
    requestExample: JSON.stringify({
      phone: "+251912345678",
      otp: "123456",
      purpose: "registration"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: 'Phone verified successfully',
      data: {
        user: 'User object',
        token: 'JWT access token',
        refreshToken: 'JWT refresh token'
      }
    },
    responseError: {
      success: false,
      message: 'Invalid or expired OTP'
    }
  },
  {
    title: 'Login',
    method: 'POST',
    endpoint: '/api/auth/login',
    description: 'Login with phone number and password',
    category: 'Authentication',
    requiresAuth: false,
    order: 3,
    requestBody: {
      phone: 'string (required)',
      password: 'string (required)'
    },
    requestExample: JSON.stringify({
      phone: "+251912345678",
      password: "password123"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: 'Login successful',
      data: {
        user: 'User object',
        token: 'JWT access token',
        refreshToken: 'JWT refresh token'
      }
    },
    responseError: {
      success: false,
      message: 'Invalid credentials'
    }
  },
  {
    title: 'Request Password Reset',
    method: 'POST',
    endpoint: '/api/auth/forgot-password',
    description: 'Request password reset OTP via phone number',
    category: 'Authentication',
    requiresAuth: false,
    order: 4,
    requestBody: {
      phone: 'string (required)'
    },
    requestExample: JSON.stringify({
      phone: "+251912345678"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: 'OTP sent to your phone',
      data: {
        phone: 'string',
        otpSent: true
      }
    },
    responseError: {
      success: false,
      message: 'Phone number not found'
    }
  },
  {
    title: 'Reset Password',
    method: 'POST',
    endpoint: '/api/auth/reset-password',
    description: 'Reset password using OTP verification',
    category: 'Authentication',
    requiresAuth: false,
    order: 5,
    requestBody: {
      phone: 'string (required)',
      otp: 'string (required)',
      newPassword: 'string (required, min 8 characters)'
    },
    requestExample: JSON.stringify({
      phone: "+251912345678",
      otp: "123456",
      newPassword: "newpassword123"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: 'Password reset successful'
    },
    responseError: {
      success: false,
      message: 'Invalid or expired OTP'
    }
  },
  {
    title: 'Get Profile',
    method: 'GET',
    endpoint: '/api/auth/profile',
    description: 'Get current authenticated user profile',
    category: 'User Profile',
    requiresAuth: true,
    order: 6,
    requestBody: null,
    requestExample: 'Headers: { Authorization: "Bearer <token>" }',
    responseSuccess: {
      success: true,
      data: {
        user: 'Complete user object with all fields'
      }
    },
    responseError: {
      success: false,
      message: 'Unauthorized'
    }
  },
  {
    title: 'Update Profile',
    method: 'PUT',
    endpoint: '/api/auth/profile',
    description: 'Update current user profile information',
    category: 'User Profile',
    requiresAuth: true,
    order: 7,
    requestBody: {
      firstName: 'string (optional)',
      lastName: 'string (optional)',
      email: 'string (optional)',
      address: 'string (optional)',
      profileImage: 'string (optional, URL)'
    },
    requestExample: JSON.stringify({
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      address: "New Address, Addis Ababa"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: 'Updated user object'
      }
    },
    responseError: {
      success: false,
      message: 'Update failed'
    }
  },
  {
    title: 'Change Password',
    method: 'POST',
    endpoint: '/api/auth/change-password',
    description: 'Change password for authenticated user',
    category: 'User Profile',
    requiresAuth: true,
    order: 8,
    requestBody: {
      currentPassword: 'string (required)',
      newPassword: 'string (required, min 8 characters)'
    },
    requestExample: JSON.stringify({
      currentPassword: "oldpassword123",
      newPassword: "newpassword123"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: 'Password changed successfully'
    },
    responseError: {
      success: false,
      message: 'Current password is incorrect'
    }
  },
  {
    title: 'Refresh Token',
    method: 'POST',
    endpoint: '/api/auth/refresh-token',
    description: 'Get new access token using refresh token',
    category: 'Authentication',
    requiresAuth: false,
    order: 9,
    requestBody: {
      refreshToken: 'string (required)'
    },
    requestExample: JSON.stringify({
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }, null, 2),
    responseSuccess: {
      success: true,
      data: {
        token: 'New JWT access token',
        refreshToken: 'New refresh token'
      }
    },
    responseError: {
      success: false,
      message: 'Invalid refresh token'
    }
  },
  {
    title: 'Logout',
    method: 'POST',
    endpoint: '/api/auth/logout',
    description: 'Logout current user and invalidate tokens',
    category: 'Authentication',
    requiresAuth: true,
    order: 10,
    requestBody: null,
    requestExample: 'Headers: { Authorization: "Bearer <token>" }',
    responseSuccess: {
      success: true,
      message: 'Logged out successfully'
    },
    responseError: {
      success: false,
      message: 'Logout failed'
    }
  },
  {
    title: 'Resend OTP',
    method: 'POST',
    endpoint: '/api/auth/resend-otp',
    description: 'Resend OTP to phone number',
    category: 'Authentication',
    requiresAuth: false,
    order: 11,
    requestBody: {
      phone: 'string (required)',
      purpose: 'string (required: "registration", "login", or "password_reset")'
    },
    requestExample: JSON.stringify({
      phone: "+251912345678",
      purpose: "registration"
    }, null, 2),
    responseSuccess: {
      success: true,
      message: 'OTP resent successfully',
      data: {
        otpSent: true
      }
    },
    responseError: {
      success: false,
      message: 'Failed to resend OTP'
    }
  }
];

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Clear existing auth APIs
    await ApiEndpoint.deleteMany({ category: { $in: ['Authentication', 'User Profile'] } });
    console.log('Cleared existing auth APIs');
    
    // Insert new APIs
    const result = await ApiEndpoint.insertMany(authApis);
    console.log(`✅ Successfully migrated ${result.length} API endpoints`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
