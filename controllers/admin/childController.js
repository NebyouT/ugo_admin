const Child = require('../../models/Child');
const Parent = require('../../models/Parent');
const School = require('../../models/School');
const mongoose = require('mongoose');

// @desc    Create new child
// @route   POST /api/admin/children
exports.createChild = async (req, res) => {
  try {
    const childData = { ...req.body };
    
    // Validate required fields
    if (!childData.parent || !childData.school) {
      return res.status(400).json({
        success: false,
        message: 'Parent and school are required'
      });
    }

    // Validate parent exists
    const parent = await Parent.findById(childData.parent);
    if (!parent || !parent.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive parent'
      });
    }

    // Validate school exists
    const school = await School.findById(childData.school);
    if (!school || !school.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive school'
      });
    }

    // Create child
    const child = await Child.create(childData);

    // Add child to parent's children array
    parent.children.push(child._id);
    await parent.save();

    // Update school student count
    await school.updateStudentCount(school.totalStudents + 1);

    res.status(201).json({
      success: true,
      message: 'Child created successfully',
      data: child.getPublicProfile()
    });
  } catch (error) {
    console.error('Create child error:', error);
    
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
      message: 'Server error while creating child'
    });
  }
};

// @desc    Get all children with pagination and filtering
// @route   GET /api/admin/children
exports.getChildren = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filters
    const filters = { isActive: true };
    
    if (req.query.parent) {
      filters.parent = req.query.parent;
    }
    
    if (req.query.school) {
      filters.school = req.query.school;
    }
    
    if (req.query.grade) {
      filters.grade = req.query.grade;
    }
    
    if (req.query.gender) {
      filters.gender = req.query.gender;
    }

    // Search
    let children;
    let total;
    
    if (req.query.search) {
      children = await Child.searchChildren(req.query.search, filters)
        .skip(skip)
        .limit(limit);
      
      // Get total count for search
      const searchFilters = {
        ...filters,
        $or: [
          { firstName: { $regex: req.query.search, $options: 'i' } },
          { lastName: { $regex: req.query.search, $options: 'i' } },
          { studentId: { $regex: req.query.search, $options: 'i' } }
        ]
      };
      total = await Child.countDocuments(searchFilters);
    } else {
      children = await Child.find(filters)
        .populate('school', 'name type location.city')
        .populate('parent', 'firstName lastName email phone')
        .sort({ firstName: 1, lastName: 1 })
        .skip(skip)
        .limit(limit);
      total = await Child.countDocuments(filters);
    }

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    res.json({
      success: true,
      data: {
        children: children.map(child => child.getPublicProfile()),
        pagination
      }
    });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching children'
    });
  }
};

// @desc    Get single child
// @route   GET /api/admin/children/:id
exports.getChild = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    const child = await Child.findById(req.params.id)
      .populate('school', 'name type location.city phone email')
      .populate('parent', 'firstName lastName email phone occupation');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    if (!child.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Child is not active'
      });
    }

    res.json({
      success: true,
      data: child.getPublicProfile()
    });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching child'
    });
  }
};

// @desc    Update child
// @route   PUT /api/admin/children/:id
exports.updateChild = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    const updateData = { ...req.body };

    // Handle school change
    if (updateData.school && updateData.school !== child.school.toString()) {
      // Validate new school
      const newSchool = await School.findById(updateData.school);
      if (!newSchool || !newSchool.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive school'
        });
      }

      const oldSchoolId = child.school;
      
      // Update child's school
      child.school = updateData.school;
      
      // Update old school student count
      const oldSchool = await School.findById(oldSchoolId);
      if (oldSchool) {
        await oldSchool.updateStudentCount(Math.max(0, oldSchool.totalStudents - 1));
      }
      
      // Update new school student count
      await newSchool.updateStudentCount(newSchool.totalStudents + 1);
      
      delete updateData.school;
    }

    // Handle parent change
    if (updateData.parent && updateData.parent !== child.parent.toString()) {
      // Validate new parent
      const newParent = await Parent.findById(updateData.parent);
      if (!newParent || !newParent.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive parent'
        });
      }

      const oldParentId = child.parent;
      
      // Update child's parent
      child.parent = updateData.parent;
      
      // Remove child from old parent
      const oldParent = await Parent.findById(oldParentId);
      if (oldParent) {
        oldParent.children.pull(child._id);
        await oldParent.save();
      }
      
      // Add child to new parent
      newParent.children.push(child._id);
      await newParent.save();
      
      delete updateData.parent;
    }

    // Update other fields
    Object.assign(child, updateData);
    await child.save();

    res.json({
      success: true,
      message: 'Child updated successfully',
      data: child.getPublicProfile()
    });
  } catch (error) {
    console.error('Update child error:', error);
    
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
      message: 'Server error while updating child'
    });
  }
};

// @desc    Delete child (soft delete)
// @route   DELETE /api/admin/children/:id
exports.deleteChild = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid child ID'
      });
    }

    const child = await Child.findById(req.params.id);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    // Remove child from parent's children array
    const parent = await Parent.findById(child.parent);
    if (parent) {
      parent.children.pull(child._id);
      await parent.save();
    }

    // Update school student count
    const school = await School.findById(child.school);
    if (school) {
      await school.updateStudentCount(Math.max(0, school.totalStudents - 1));
    }

    // Soft delete child
    child.isActive = false;
    await child.save();

    res.json({
      success: true,
      message: 'Child deleted successfully'
    });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting child'
    });
  }
};

// @desc    Get child statistics
// @route   GET /api/admin/children/stats
exports.getChildStats = async (req, res) => {
  try {
    const stats = await Child.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get child stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching child statistics'
    });
  }
};

// @desc    Get children by parent
// @route   GET /api/admin/children/parent/:parentId
exports.getChildrenByParent = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.parentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent ID'
      });
    }

    const children = await Child.findByParent(req.params.parentId);

    res.json({
      success: true,
      data: children.map(child => child.getPublicProfile())
    });
  } catch (error) {
    console.error('Get children by parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching children by parent'
    });
  }
};

// @desc    Get children by school
// @route   GET /api/admin/children/school/:schoolId
exports.getChildrenBySchool = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.schoolId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
    }

    const children = await Child.findBySchool(req.params.schoolId);

    res.json({
      success: true,
      data: children.map(child => child.getPublicProfile())
    });
  } catch (error) {
    console.error('Get children by school error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching children by school'
    });
  }
};

// @desc    Add child to parent (quick add)
// @route   POST /api/admin/parents/:parentId/children
exports.addChildToParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    const childData = { ...req.body, parent: parentId };

    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent ID'
      });
    }

    // Validate parent exists
    const parent = await Parent.findById(parentId);
    if (!parent || !parent.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive parent'
      });
    }

    // Validate school exists
    if (!childData.school) {
      return res.status(400).json({
        success: false,
        message: 'School is required'
      });
    }

    const school = await School.findById(childData.school);
    if (!school || !school.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive school'
      });
    }

    // Create child
    const child = await Child.create(childData);

    // Add child to parent's children array
    parent.children.push(child._id);
    await parent.save();

    // Update school student count
    await school.updateStudentCount(school.totalStudents + 1);

    res.status(201).json({
      success: true,
      message: 'Child added to parent successfully',
      data: child.getPublicProfile()
    });
  } catch (error) {
    console.error('Add child to parent error:', error);
    
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
      message: 'Server error while adding child to parent'
    });
  }
};

// @desc    Remove child from parent
// @route   DELETE /api/admin/parents/:parentId/children/:childId
exports.removeChildFromParent = async (req, res) => {
  try {
    const { parentId, childId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(parentId) || !mongoose.Types.ObjectId.isValid(childId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent or child ID'
      });
    }

    const child = await Child.findById(childId);

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    if (child.parent.toString() !== parentId) {
      return res.status(400).json({
        success: false,
        message: 'Child does not belong to this parent'
      });
    }

    // Remove child from parent's children array
    const parent = await Parent.findById(parentId);
    if (parent) {
      parent.children.pull(child._id);
      await parent.save();
    }

    // Update school student count
    const school = await School.findById(child.school);
    if (school) {
      await school.updateStudentCount(Math.max(0, school.totalStudents - 1));
    }

    // Soft delete child
    child.isActive = false;
    await child.save();

    res.json({
      success: true,
      message: 'Child removed from parent successfully'
    });
  } catch (error) {
    console.error('Remove child from parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing child from parent'
    });
  }
};
