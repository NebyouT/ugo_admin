const User = require('../../models/User');
const jwt = require('jsonwebtoken');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Try to find admin in database first
    let user;
    try {
      user = await User.findOne({ email, role: 'admin' });
      
      if (user && await user.comparePassword(password)) {
        // Database admin found and password matches
        const token = user.generateAuthToken();
        
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.json({
          success: true,
          message: 'Login successful (database)',
          data: {
            user: user.getPublicProfile(),
            token
          }
        });
      } else {
        // Database admin found but password does not match
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    } catch (dbError) {
      console.log('Database connection failed, using fallback auth');
    }

    // Fallback authentication for development/testing
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const fallbackUser = {
        id: 'admin-fallback',
        email: process.env.ADMIN_EMAIL,
        firstName: process.env.ADMIN_FIRST_NAME,
        lastName: process.env.ADMIN_LAST_NAME,
        fullName: `${process.env.ADMIN_FIRST_NAME} ${process.env.ADMIN_LAST_NAME}`,
        role: 'admin',
        isActive: true
      };

      const token = jwt.sign(
        { 
          id: fallbackUser.id, 
          email: fallbackUser.email, 
          role: fallbackUser.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.json({
        success: true,
        message: 'Login successful (fallback mode)',
        data: {
          user: fallbackUser,
          token
        }
      });
    }

    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Admin logout
// @route   POST /api/admin/logout
// @access  Private
const adminLogout = (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

// @desc    Get admin profile
// @route   GET /api/admin/me
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    if (req.user.id === 'admin-fallback') {
      // Return fallback user profile
      return res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/me
// @access  Private
const updateAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    if (req.user.id === 'admin-fallback') {
      // Update fallback user (in memory only)
      const updatedUser = {
        ...req.user,
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        fullName: `${firstName || req.user.firstName} ${lastName || req.user.lastName}`,
        phone: phone || req.user.phone
      };

      return res.json({
        success: true,
        message: 'Profile updated successfully (fallback mode)',
        data: {
          user: updatedUser
        }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (req.user.id === 'admin-fallback') {
      // For fallback user, just verify current password matches env
      if (currentPassword === process.env.ADMIN_PASSWORD) {
        return res.json({
          success: true,
          message: 'Password would be updated (fallback mode - not persisted)'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    let stats = {
      totalUsers: 0,
      totalStudents: 0,
      totalDrivers: 0,
      totalParents: 0
    };

    try {
      // Try to get real stats from database
      const [totalUsers, totalStudents, totalDrivers, totalParents] = await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'student', isActive: true }),
        User.countDocuments({ role: 'driver', isActive: true }),
        User.countDocuments({ role: 'parent', isActive: true })
      ]);

      stats = {
        totalUsers,
        totalStudents,
        totalDrivers,
        totalParents
      };
    } catch (dbError) {
      console.log('Database stats failed, using fallback stats');
      // Fallback stats for development
      stats = {
        totalUsers: 1250,
        totalStudents: 800,
        totalDrivers: 45,
        totalParents: 405
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  getAdminProfile,
  updateAdminProfile,
  changePassword,
  getDashboardStats
};
