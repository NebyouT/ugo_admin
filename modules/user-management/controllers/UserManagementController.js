const User = require('../models/User');
const DriverDetail = require('../models/DriverDetail');
const UserRole = require('../models/UserRole');
const UserLevel = require('../models/UserLevel');

class UserManagementController {
  // Get all users with filtering and pagination
  static async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        userType,
        customerType,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query = {};
      
      if (userType && userType !== 'all') {
        query.userType = userType;
      }
      
      if (customerType && customerType !== 'all') {
        query.customerType = customerType;
      }
      
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      // Sort options
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const users = await User.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  // Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      let user = await User.findById(id)
        .populate('userLevel', 'name level badgeColor benefits')
        .populate('referredBy', 'firstName lastName email');

      // If driver, populate driver details
      if (user && user.userType === 'driver') {
        user = await User.findById(id)
          .populate('userLevel', 'name level badgeColor benefits')
          .populate('referredBy', 'firstName lastName email')
          .populate({
            path: 'driverInfo.vehicleAssigned',
            select: 'make model licensePlate category'
          });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user'
      });
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.firstName || !userData.lastName || !userData.email || !userData.phone || !userData.password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: firstName, lastName, email, phone, password'
        });
      }
      
      // Check if email or phone already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { phone: userData.phone }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone already exists'
        });
      }

      // Generate referral code if not provided
      if (!userData.referralCode) {
        userData.referralCode = `UGO${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      }

      // Create user with all data (including children and driverInfo)
      const user = new User(userData);
      await user.save();

      // Create driver details if user type is driver
      if (userData.userType === 'driver' && userData.driverInfo) {
        try {
          const driverDetail = new DriverDetail({
            user: user._id,
            licenseNumber: userData.driverInfo.licenseNumber,
            licenseExpiry: userData.driverInfo.licenseExpiry,
            vehicleType: userData.driverInfo.vehicleType,
            services: userData.driverInfo.services || ['ride'],
            isVerified: userData.driverInfo.isVerified || false
          });
          await driverDetail.save();
        } catch (driverError) {
          console.log('Driver detail creation failed (non-critical):', driverError.message);
        }
      }

      // Try to update role and level counts (non-critical)
      try {
        if (userData.role) {
          await UserRole.findOneAndUpdate(
            { name: userData.role },
            { $inc: { userCount: 1 } },
            { upsert: false }
          );
        }
        
        if (userData.userLevel) {
          await UserLevel.findByIdAndUpdate(
            userData.userLevel,
            { $inc: { userCount: 1 } }
          );
        }
      } catch (countError) {
        console.log('Count update failed (non-critical):', countError.message);
      }

      // Return user without trying to populate if UserLevel doesn't exist
      const createdUser = await User.findById(user._id).lean();

      res.status(201).json({
        success: true,
        message: `${userData.userType === 'driver' ? 'Driver' : userData.userType === 'customer' ? 'Parent' : 'User'} created successfully`,
        data: { user: createdUser }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create user'
      });
    }
  }

  // Update user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email/phone is being changed and if it already exists
      if (updateData.email || updateData.phone) {
        const existingUser = await User.findOne({
          _id: { $ne: id },
          $or: [
            ...(updateData.email ? [{ email: updateData.email }] : []),
            ...(updateData.phone ? [{ phone: updateData.phone }] : [])
          ]
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email or phone already exists'
          });
        }
      }

      // Handle role change
      if (updateData.role && updateData.role !== user.role) {
        // Decrement old role count
        if (user.role) {
          await UserRole.findOneAndUpdate(
            { name: user.role },
            { $inc: { userCount: -1 } }
          );
        }
        
        // Increment new role count
        await UserRole.findOneAndUpdate(
          { name: updateData.role },
          { $inc: { userCount: 1 } }
        );
      }

      // Handle level change
      if (updateData.userLevel && updateData.userLevel.toString() !== user.userLevel?.toString()) {
        // Decrement old level count
        if (user.userLevel) {
          await UserLevel.findByIdAndUpdate(
            user.userLevel,
            { $inc: { userCount: -1 } }
          );
        }
        
        // Increment new level count
        await UserLevel.findByIdAndUpdate(
          updateData.userLevel,
          { $inc: { userCount: 1 } }
        );
      }

      // Update user
      Object.assign(user, updateData);
      await user.save();

      const populatedUser = await User.findById(user._id)
        .populate('userLevel', 'name level badgeColor');

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: populatedUser }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  // Delete user (soft delete)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Soft delete user
      user.isActive = false;
      await user.save();

      // Update role and level counts
      if (user.role) {
        await UserRole.findOneAndUpdate(
          { name: user.role },
          { $inc: { userCount: -1 } }
        );
      }
      
      if (user.userLevel) {
        await UserLevel.findByIdAndUpdate(
          user.userLevel,
          { $inc: { userCount: -1 } }
        );
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      const [
        totalUsers,
        userStats,
        driverStats,
        levelStats,
        roleStats
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        User.getCustomerStats(),
        DriverDetail.getDriverStats(),
        UserLevel.getLevelStats(),
        UserRole.getRoleStats()
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          customerStats: userStats,
          driverStats: driverStats[0] || {},
          levelStats: levelStats[0] || {},
          roleStats
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics'
      });
    }
  }

  // Get customers only
  static async getCustomers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        customerType,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = { userType: 'customer' };
      
      if (customerType && customerType !== 'all') {
        query.customerType = customerType;
      }
      
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const customers = await User.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers'
      });
    }
  }

  // Get drivers only
  static async getDrivers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        verificationStatus,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = { userType: 'driver' };
      
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
      
      if (verificationStatus && verificationStatus !== 'all') {
        query['driverInfo.isVerified'] = verificationStatus === 'verified';
      }
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { 'driverInfo.licenseNumber': { $regex: search, $options: 'i' } }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const drivers = await User.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get driver details for each driver
      const driversWithDetails = await Promise.all(
        drivers.map(async (driver) => {
          const driverDetail = await DriverDetail.findOne({ user: driver._id }).lean();
          return {
            ...driver,
            driverDetail
          };
        })
      );

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          drivers: driversWithDetails,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get drivers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch drivers'
      });
    }
  }

  // Toggle user status (activate/deactivate)
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      // Update role and level counts
      if (user.role) {
        const role = await UserRole.findOne({ name: user.role });
        if (user.isActive) {
          await role.incrementUserCount();
        } else {
          await role.decrementUserCount();
        }
      }
      
      if (user.userLevel) {
        const level = await UserLevel.findById(user.userLevel);
        if (user.isActive) {
          await level.incrementUserCount();
        } else {
          await level.decrementUserCount();
        }
      }

      res.json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user }
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle user status'
      });
    }
  }
}

module.exports = UserManagementController;
