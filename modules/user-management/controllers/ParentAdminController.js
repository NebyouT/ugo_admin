const User = require('../models/User');
const Child = require('../../children/models/Child');

class ParentAdminController {
  // GET /api/admin/parents - Get all parents with children
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      
      // Build query - customers with children are considered parents
      let query = { 
        userType: 'customer',
        customerType: 'parent'
      };
      
      if (status) {
        query.status = status;
      }
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
      
      const parents = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      // Get children for each parent
      const parentsWithChildren = await Promise.all(
        parents.map(async (parent) => {
          const children = await Child.find({ 
            parent: parent._id, 
            isActive: true 
          })
            .populate('subscription.driver', 'firstName lastName phone')
            .populate('subscription.group', 'name')
            .lean();
          
          return {
            ...parent,
            children: children.map(child => ({
              id: child._id,
              name: child.name,
              grade: child.grade,
              pickupAddress: child.pickupAddress,
              schedules: child.formattedSchedules,
              school: child.school,
              subscription: child.subscription,
              createdAt: child.createdAt,
              updatedAt: child.updatedAt
            }))
          };
        })
      );

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        message: 'Parents retrieved successfully with simplified fields',
        data: {
          parents: parentsWithChildren.map(parent => ({
            id: parent._id,
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            phone: parent.phone,
            status: parent.status,
            parentInfo: parent.parentInfo,
            address: parent.address,
            createdAt: parent.createdAt
          })),
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get parents error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENTS_FAILED',
          message: 'Failed to retrieve parents',
          details: error.message
        }
      });
    }
  }

  // GET /api/admin/parents/:id - Get specific parent
  static async getById(req, res) {
    try {
      const parent = await User.findOne({ 
        _id: req.params.id, 
        userType: 'customer',
        customerType: 'parent'
      }).select('-password').lean();

      if (!parent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent not found'
          }
        });
      }

      // Get parent's children
      const children = await Child.find({ 
        parent: parent._id, 
        isActive: true 
      })
        .populate('subscription.driver', 'firstName lastName phone')
        .populate('subscription.group', 'name')
        .lean();

      const formattedChildren = children.map(child => ({
        id: child._id,
        name: child.name,
        grade: child.grade,
        pickupAddress: child.pickupAddress,
        schedules: child.formattedSchedules,
        school: child.school,
        subscription: child.subscription,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt
      }));

      res.json({
        success: true,
        message: 'Parent retrieved successfully',
        data: {
          parent: {
            ...parent,
            children: formattedChildren
          }
        }
      });
    } catch (error) {
      console.error('Get parent error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENT_FAILED',
          message: 'Failed to retrieve parent',
          details: error.message
        }
      });
    }
  }

  // POST /api/admin/parents - Create new parent
  static async create(req, res) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        parentInfo,
        address
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !phone || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'First name, last name, email, phone, and password are required'
          }
        });
      }

      // Check if email or phone already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { phone: phone }
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: 'A user with this email or phone already exists'
          }
        });
      }

      // Create parent (customer with parent customerType)
      const parent = new User({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: password,
        userType: 'customer',
        role: 'customer',
        customerType: 'parent',
        isActive: true,
        status: 'active',
        emailVerified: false,
        isEmailVerified: false,
        isPhoneVerified: false,
        parentInfo: parentInfo || {},
        address: address || {},
        createdBy: req.user._id
      });

      await parent.save();

      // Remove password from response
      const parentResponse = parent.toObject();
      delete parentResponse.password;

      res.status(201).json({
        success: true,
        message: 'Parent created successfully',
        data: {
          parent: parentResponse
        }
      });
    } catch (error) {
      console.error('Create parent error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_PARENT_FAILED',
          message: 'Failed to create parent',
          details: error.message
        }
      });
    }
  }

  // PUT /api/admin/parents/:id - Update parent
  static async update(req, res) {
    try {
      const {
        firstName,
        lastName,
        phone,
        parentInfo,
        address,
        status
      } = req.body;

      const parent = await User.findOne({ 
        _id: req.params.id, 
        userType: 'customer',
        customerType: 'parent'
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent not found'
          }
        });
      }

      // Update allowed fields
      if (firstName) parent.firstName = firstName.trim();
      if (lastName) parent.lastName = lastName.trim();
      if (phone) parent.phone = phone.trim();
      if (parentInfo) parent.parentInfo = { ...parent.parentInfo, ...parentInfo };
      if (address) parent.address = { ...parent.address, ...address };
      if (status) parent.status = status;
      
      parent.updatedBy = req.user._id;
      await parent.save();

      // Remove password from response
      const parentResponse = parent.toObject();
      delete parentResponse.password;

      res.json({
        success: true,
        message: 'Parent updated successfully',
        data: {
          parent: parentResponse
        }
      });
    } catch (error) {
      console.error('Update parent error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_PARENT_FAILED',
          message: 'Failed to update parent',
          details: error.message
        }
      });
    }
  }

  // DELETE /api/admin/parents/:id - Delete parent
  static async delete(req, res) {
    try {
      const parent = await User.findOne({ 
        _id: req.params.id, 
        userType: 'customer',
        customerType: 'parent'
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent not found'
          }
        });
      }

      // Check if parent has children
      const childrenCount = await Child.countDocuments({ 
        parent: parent._id, 
        isActive: true 
      });

      if (childrenCount > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PARENT_HAS_CHILDREN',
            message: 'Cannot delete parent with active children. Please delete or reassign children first.'
          }
        });
      }

      // Soft delete parent
      parent.isActive = false;
      parent.status = 'deleted';
      parent.updatedBy = req.user._id;
      await parent.save();

      res.json({
        success: true,
        message: 'Parent deleted successfully'
      });
    } catch (error) {
      console.error('Delete parent error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_PARENT_FAILED',
          message: 'Failed to delete parent',
          details: error.message
        }
      });
    }
  }

  // GET /api/admin/parents/stats - Get parent statistics
  static async getStats(req, res) {
    try {
      const totalParents = await User.countDocuments({ 
        userType: 'customer',
        customerType: 'parent'
      });
      const activeParents = await User.countDocuments({ 
        userType: 'customer',
        customerType: 'parent',
        status: 'active'
      });
      const totalChildren = await Child.countDocuments({ isActive: true });
      
      // Get subscription statistics
      const parentsWithChildren = await User.find({ 
        userType: 'customer',
        customerType: 'parent',
        isActive: true 
      }).lean();
      
      const parentIds = parentsWithChildren.map(p => p._id);
      const childrenWithSubscriptions = await Child.find({ 
        parent: { $in: parentIds },
        isActive: true,
        'subscription.status': 'active'
      }).lean();
      
      const activeSubscriptions = childrenWithSubscriptions.length;
      
      // Calculate average children per parent
      const avgChildrenPerParent = totalParents > 0 ? (totalChildren / totalParents).toFixed(2) : 0;

      res.json({
        success: true,
        message: 'Parent statistics retrieved successfully',
        data: {
          totalParents,
          activeParents,
          inactiveParents: totalParents - activeParents,
          totalChildren,
          activeSubscriptions,
          avgChildrenPerParent: parseFloat(avgChildrenPerParent)
        }
      });
    } catch (error) {
      console.error('Get parent stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENT_STATS_FAILED',
          message: 'Failed to retrieve parent statistics',
          details: error.message
        }
      });
    }
  }
}

module.exports = ParentAdminController;
