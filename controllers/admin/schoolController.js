const School = require('../../models/School');
const mongoose = require('mongoose');

// @desc    Create new school
// @route   POST /api/admin/schools
exports.createSchool = async (req, res) => {
  try {
    const schoolData = { ...req.body };
    
    // Validate coordinates
    if (!schoolData.coordinates || !schoolData.coordinates.lat || !schoolData.coordinates.lng) {
      return res.status(400).json({
        success: false,
        message: 'School coordinates are required'
      });
    }

    // Check if school with same name and location already exists
    const existingSchool = await School.findOne({
      name: schoolData.name,
      'location.address': schoolData.address,
      'location.city': schoolData.city
    });

    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'A school with this name already exists at this location'
      });
    }

    // Create school
    const school = await School.create({
      ...schoolData,
      location: {
        address: schoolData.address,
        coordinates: {
          lat: parseFloat(schoolData.coordinates.lat),
          lng: parseFloat(schoolData.coordinates.lng)
        },
        city: schoolData.city,
        subCity: schoolData.subCity || '',
        woreda: schoolData.woreda || ''
      }
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school.getPublicProfile()
    });
  } catch (error) {
    console.error('Create school error:', error);
    
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
      message: 'Server error while creating school'
    });
  }
};

// @desc    Get all schools with pagination and filtering
// @route   GET /api/admin/schools
exports.getSchools = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filters
    const filters = { isActive: true };
    
    if (req.query.type) {
      filters.type = req.query.type;
    }
    
    if (req.query.city) {
      filters['location.city'] = req.query.city;
    }

    // Search
    let schools;
    let total;
    
    if (req.query.search) {
      schools = await School.searchSchools(req.query.search, filters)
        .skip(skip)
        .limit(limit);
      
      // Get total count for search
      const searchFilters = {
        ...filters,
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { type: { $regex: req.query.search, $options: 'i' } },
          { 'location.city': { $regex: req.query.search, $options: 'i' } },
          { 'location.address': { $regex: req.query.search, $options: 'i' } }
        ]
      };
      total = await School.countDocuments(searchFilters);
    } else {
      schools = await School.find(filters)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);
      total = await School.countDocuments(filters);
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
        schools: schools.map(school => school.getPublicProfile()),
        pagination
      }
    });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schools'
    });
  }
};

// @desc    Get single school
// @route   GET /api/admin/schools/:id
exports.getSchool = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
    }

    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    if (!school.isActive) {
      return res.status(404).json({
        success: false,
        message: 'School is not active'
      });
    }

    res.json({
      success: true,
      data: school.getPublicProfile()
    });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching school'
    });
  }
};

// @desc    Update school
// @route   PUT /api/admin/schools/:id
exports.updateSchool = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
    }

    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    const updateData = { ...req.body };

    // Handle coordinates update
    if (updateData.coordinates) {
      if (!updateData.coordinates.lat || !updateData.coordinates.lng) {
        return res.status(400).json({
          success: false,
          message: 'Both latitude and longitude are required'
        });
      }
      
      updateData.location = {
        ...school.location,
        coordinates: {
          lat: parseFloat(updateData.coordinates.lat),
          lng: parseFloat(updateData.coordinates.lng)
        }
      };
      
      delete updateData.coordinates;
    }

    // Handle location update
    if (updateData.address || updateData.city || updateData.subCity || updateData.woreda) {
      updateData.location = {
        ...school.location,
        ...(updateData.address && { address: updateData.address }),
        ...(updateData.city && { city: updateData.city }),
        ...(updateData.subCity && { subCity: updateData.subCity }),
        ...(updateData.woreda && { woreda: updateData.woreda })
      };
      
      delete updateData.address;
      delete updateData.city;
      delete updateData.subCity;
      delete updateData.woreda;
    }

    // Check for duplicate name/location (excluding current school)
    if (updateData.name || updateData.location) {
      const duplicateCheck = await School.findOne({
        _id: { $ne: req.params.id },
        name: updateData.name || school.name,
        'location.address': updateData.location?.address || school.location.address,
        'location.city': updateData.location?.city || school.location.city
      });

      if (duplicateCheck) {
        return res.status(400).json({
          success: false,
          message: 'A school with this name already exists at this location'
        });
      }
    }

    Object.assign(school, updateData);
    await school.save();

    res.json({
      success: true,
      message: 'School updated successfully',
      data: school.getPublicProfile()
    });
  } catch (error) {
    console.error('Update school error:', error);
    
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
      message: 'Server error while updating school'
    });
  }
};

// @desc    Delete school (soft delete)
// @route   DELETE /api/admin/schools/:id
exports.deleteSchool = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid school ID'
      });
    }

    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check if school has associated children
    const Child = require('../../models/Child');
    const childrenCount = await Child.countDocuments({ 
      school: req.params.id, 
      isActive: true 
    });

    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete school with ${childrenCount} associated children. Please reassign or remove the children first.`
      });
    }

    // Soft delete
    school.isActive = false;
    await school.save();

    res.json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting school'
    });
  }
};

// @desc    Get school statistics
// @route   GET /api/admin/schools/stats
exports.getSchoolStats = async (req, res) => {
  try {
    const stats = await School.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get school stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching school statistics'
    });
  }
};

// @desc    Get nearby schools
// @route   GET /api/admin/schools/nearby
exports.getNearbySchools = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const schools = await School.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(maxDistance)
    );

    res.json({
      success: true,
      data: schools.map(school => school.getPublicProfile())
    });
  } catch (error) {
    console.error('Get nearby schools error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching nearby schools'
    });
  }
};

// @desc    Get schools by city
// @route   GET /api/admin/schools/city/:city
exports.getSchoolsByCity = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City is required'
      });
    }

    const schools = await School.findByCity(city);

    res.json({
      success: true,
      data: schools.map(school => school.getPublicProfile())
    });
  } catch (error) {
    console.error('Get schools by city error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schools by city'
    });
  }
};
