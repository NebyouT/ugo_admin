const Parent = require('../../models/Parent');
const User = require('../../models/User');

// @desc    Create new parent
// @route   POST /api/admin/parents
// @access  Private (Admin only)
const createParent = async (req, res) => {
  try {
    const parentData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      occupation: req.body.occupation,
      workplace: req.body.workplace,
      address: req.body.address,
      emergencyContact: req.body.emergencyContact,
      idType: req.body.idType,
      idNumber: req.body.idNumber
    };

    // Check if parent with this email already exists
    const existingParent = await Parent.findOne({ email: parentData.email });
    if (existingParent) {
      return res.status(400).json({
        success: false,
        message: 'Parent with this email already exists'
      });
    }

    // Create parent
    const parent = await Parent.createParent(parentData, req.user.id);

    // Handle children creation if provided
    if (parentData.children && Array.isArray(parentData.children) && parentData.children.length > 0) {
      const Child = require('../../models/Child');
      const School = require('../../models/School');
      
      const childrenPromises = parentData.children.map(async (childData) => {
        try {
          // Validate school exists
          const school = await School.findById(childData.school);
          if (!school || !school.isActive) {
            throw new Error(`Invalid school: ${childData.school}`);
          }

          // Create child with parent reference
          const child = await Child.create({
            ...childData,
            parent: parent._id
          });

          // Add child to parent's children array
          parent.children.push(child._id);

          // Update school student count
          await school.updateStudentCount(school.totalStudents + 1);

          return child;
        } catch (error) {
          console.error('Error creating child:', error);
          throw error;
        }
      });

      try {
        const createdChildren = await Promise.all(childrenPromises);
        
        // Save parent with children references
        await parent.save();
        
        res.status(201).json({
          success: true,
          message: `Parent and ${createdChildren.length} children created successfully`,
          data: {
            parent: parent.getPublicProfile(),
            children: createdChildren.map(child => child.getPublicProfile())
          }
        });
      } catch (childError) {
        // If children creation fails, we might want to rollback parent creation
        // For now, we'll create parent without children and show error
        console.error('Error creating children:', childError);
        
        res.status(201).json({
          success: true,
          message: 'Parent created successfully, but some children could not be added',
          data: parent.getPublicProfile(),
          warning: 'Some children were not created due to errors'
        });
      }
    } else {
      res.status(201).json({
        success: true,
        message: 'Parent created successfully',
        data: parent.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Create parent error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating parent'
    });
  }
};

// @desc    Get all parents
// @route   GET /api/admin/parents
// @access  Private (Admin only)
const getParents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city, isActive } = req.query;
    
    // Build filter
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (city) {
      filter['address.city'] = city;
    }
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const parents = await Parent.findActiveParents(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ registrationDate: -1 });

    const total = await Parent.countDocuments(filter);

    res.json({
      success: true,
      data: {
        parents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    });

  } catch (error) {
    console.error('Get parents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching parents'
    });
  }
};

// @desc    Get single parent
// @route   GET /api/admin/parents/:id
// @access  Private (Admin only)
const getParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id)
      .populate('registeredBy', 'firstName lastName email')
      .populate('children', 'firstName lastName email studentId school grade');

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    res.json({
      success: true,
      data: parent.getPublicProfile()
    });

  } catch (error) {
    console.error('Get parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching parent'
    });
  }
};

// @desc    Update parent
// @route   PUT /api/admin/parents/:id
// @access  Private (Admin only)
const updateParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== parent.email) {
      const existingParent = await Parent.findOne({ 
        email: req.body.email, 
        _id: { $ne: parent._id } 
      });
      
      if (existingParent) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another parent'
        });
      }
    }

    // Check if ID number is being changed and if it's already taken
    if (req.body.idNumber && req.body.idNumber !== parent.idNumber) {
      const existingId = await Parent.findOne({ 
        idNumber: req.body.idNumber, 
        _id: { $ne: parent._id } 
      });
      
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: 'ID number is already taken by another parent'
        });
      }
    }

    // Update parent fields
    const updateFields = [
      'firstName', 'lastName', 'email', 'phone', 'address',
      'emergencyContact', 'occupation', 'workplace', 'idType', 
      'idNumber', 'profilePicture', 'isActive'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        parent[field] = req.body[field];
      }
    });

    await parent.save();

    res.json({
      success: true,
      message: 'Parent updated successfully',
      data: parent.getPublicProfile()
    });

  } catch (error) {
    console.error('Update parent error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating parent'
    });
  }
};

// @desc    Delete parent (soft delete)
// @route   DELETE /api/admin/parents/:id
// @access  Private (Admin only)
const deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Check if parent has associated children
    if (parent.children && parent.children.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete parent with associated children. Please remove children first.'
      });
    }

    // Soft delete - set isActive to false
    parent.isActive = false;
    await parent.save();

    res.json({
      success: true,
      message: 'Parent deleted successfully'
    });

  } catch (error) {
    console.error('Delete parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting parent'
    });
  }
};

// @desc    Get parent statistics
// @route   GET /api/admin/parents/stats
// @access  Private (Admin only)
const getParentStats = async (req, res) => {
  try {
    const stats = await Parent.aggregate([
      {
        $group: {
          _id: null,
          totalParents: { $sum: 1 },
          activeParents: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveParents: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          },
          parentsWithChildren: {
            $sum: { $cond: [{ $gt: [{ $size: '$children' }, 0] }, 1, 0] }
          }
        }
      }
    ]);

    const cityStats = await Parent.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$address.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const result = stats[0] || {
      totalParents: 0,
      activeParents: 0,
      inactiveParents: 0,
      parentsWithChildren: 0
    };

    res.json({
      success: true,
      data: {
        ...result,
        cityDistribution: cityStats
      }
    });

  } catch (error) {
    console.error('Get parent stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching parent statistics'
    });
  }
};

// @desc    Add child to parent
// @route   POST /api/admin/parents/:id/children
// @access  Private (Admin only)
const addChildToParent = async (req, res) => {
  try {
    const { childId } = req.body;
    
    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    const child = await User.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if child is already associated with this parent
    if (parent.children.includes(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Child is already associated with this parent'
      });
    }

    parent.children.push(childId);
    await parent.save();

    res.json({
      success: true,
      message: 'Child added to parent successfully',
      data: parent.getPublicProfile()
    });

  } catch (error) {
    console.error('Add child to parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding child to parent'
    });
  }
};

// @desc    Remove child from parent
// @route   DELETE /api/admin/parents/:id/children/:childId
// @access  Private (Admin only)
const removeChildFromParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    parent.children = parent.children.filter(
      childId => childId.toString() !== req.params.childId
    );
    await parent.save();

    res.json({
      success: true,
      message: 'Child removed from parent successfully',
      data: parent.getPublicProfile()
    });

  } catch (error) {
    console.error('Remove child from parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing child from parent'
    });
  }
};

module.exports = {
  createParent,
  getParents,
  getParent,
  updateParent,
  deleteParent,
  getParentStats,
  addChildToParent,
  removeChildFromParent
};
