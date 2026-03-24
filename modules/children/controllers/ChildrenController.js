const Child = require('../models/Child');
const User = require('../../user-management/models/User');

class ChildrenController {
  // GET /api/children - Get all children for authenticated parent
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, day, active = true } = req.query;
      
      const children = await Child.find({ 
        parent: req.user._id, 
        isActive: active === 'true' 
      })
        .populate('subscription.driver', 'firstName lastName phone')
        .populate('subscription.group', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Child.countDocuments({ 
        parent: req.user._id, 
        isActive: active === 'true' 
      });

      const formatted = children.map(child => ({
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
        message: 'Children retrieved successfully',
        data: {
          children: formatted,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get children error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_CHILDREN_FAILED',
          message: 'Failed to retrieve children',
          details: error.message
        }
      });
    }
  }

  // GET /api/children/:id - Get specific child
  static async getById(req, res) {
    try {
      const child = await Child.findOne({ 
        _id: req.params.id, 
        parent: req.user._id,
        isActive: true 
      })
        .populate('subscription.driver', 'firstName lastName phone vehicle')
        .populate('subscription.group', 'name description')
        .lean();

      if (!child) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child not found'
          }
        });
      }

      const formatted = {
        id: child._id,
        name: child.name,
        grade: child.grade,
        pickupAddress: child.pickupAddress,
        schedules: child.schedules,
        formattedSchedules: child.formattedSchedules,
        school: child.school,
        subscription: child.subscription,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt
      };

      res.json({
        success: true,
        message: 'Child retrieved successfully',
        data: { child: formatted }
      });
    } catch (error) {
      console.error('Get child error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_CHILD_FAILED',
          message: 'Failed to retrieve child',
          details: error.message
        }
      });
    }
  }

  // POST /api/children - Create new child
  static async create(req, res) {
    try {
      const {
        name,
        grade,
        pickupAddress,
        schedules,
        school,
        schoolName
      } = req.body;

      // Validate required fields
      if (!name || !grade || !pickupAddress || !schedules || !school) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Name, grade, pickup address, schedules, and school are required'
          }
        });
      }

      // Validate pickup address coordinates
      if (!pickupAddress.coordinates || 
          !Array.isArray(pickupAddress.coordinates) || 
          pickupAddress.coordinates.length !== 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: 'Valid pickup address coordinates are required'
          }
        });
      }

      // Validate schedules (must have 2 or 4 entries per day)
      const scheduleValidation = ChildrenController.validateSchedules(schedules);
      if (!scheduleValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SCHEDULES',
            message: scheduleValidation.error
          }
        });
      }

      // Create child
      const child = new Child({
        parent: req.user._id,
        name: name.trim(),
        grade: grade.trim(),
        pickupAddress: {
          address: pickupAddress.address.trim(),
          coordinates: pickupAddress.coordinates,
          landmark: pickupAddress.landmark?.trim() || ''
        },
        schedules: schedules,
        school: school,
        schoolDetails: {
          name: schoolName || '',
          grade: grade.trim()
        },
        createdBy: req.user._id
      });

      await child.save();

      // Populate references for response
      await child.populate('subscription.driver', 'firstName lastName phone');
      await child.populate('school', 'name address city');

      res.status(201).json({
        success: true,
        message: 'Child created successfully',
        data: {
          child: {
            id: child._id,
            name: child.name,
            grade: child.grade,
            pickupAddress: child.pickupAddress,
            schedules: child.schedules,
            formattedSchedules: child.formattedSchedules,
            school: child.school,
            schoolDetails: child.schoolDetails,
            subscription: child.subscription,
            createdAt: child.createdAt
          }
        }
      });
    } catch (error) {
      console.error('Create child error:', error);
      
      // Handle validation errors
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
          code: 'CREATE_CHILD_FAILED',
          message: 'Failed to create child',
          details: error.message
        }
      });
    }
  }

  // PUT /api/children/:id - Update child
  static async update(req, res) {
    try {
      const child = await Child.findOne({ 
        _id: req.params.id, 
        parent: req.user._id,
        isActive: true 
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child not found'
          }
        });
      }

      const {
        name,
        grade,
        pickupAddress,
        schedules,
        school
      } = req.body;

      // Validate schedules if provided
      if (schedules) {
        const scheduleValidation = ChildrenController.validateSchedules(schedules);
        if (!scheduleValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_SCHEDULES',
              message: scheduleValidation.error
            }
          });
        }
      }

      // Update fields
      if (name) child.name = name.trim();
      if (grade) child.grade = grade.trim();
      if (pickupAddress) {
        child.pickupAddress = {
          address: pickupAddress.address.trim(),
          coordinates: pickupAddress.coordinates,
          landmark: pickupAddress.landmark?.trim() || ''
        };
      }
      if (schedules) child.schedules = schedules;
      if (school) child.school = school;

      child.updatedBy = req.user._id;
      await child.save();

      await child.populate('subscription.driver', 'firstName lastName phone');

      res.json({
        success: true,
        message: 'Child updated successfully',
        data: {
          child: {
            id: child._id,
            name: child.name,
            grade: child.grade,
            pickupAddress: child.pickupAddress,
            schedules: child.schedules,
            formattedSchedules: child.formattedSchedules,
            school: child.school,
            subscription: child.subscription,
            updatedAt: child.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Update child error:', error);
      
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
          code: 'UPDATE_CHILD_FAILED',
          message: 'Failed to update child',
          details: error.message
        }
      });
    }
  }

  // DELETE /api/children/:id - Soft delete child
  static async delete(req, res) {
    try {
      const child = await Child.findOne({ 
        _id: req.params.id, 
        parent: req.user._id,
        isActive: true 
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child not found'
          }
        });
      }

      child.isActive = false;
      child.updatedBy = req.user._id;
      await child.save();

      res.json({
        success: true,
        message: 'Child deleted successfully'
      });
    } catch (error) {
      console.error('Delete child error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_CHILD_FAILED',
          message: 'Failed to delete child',
          details: error.message
        }
      });
    }
  }

  // GET /api/children/:id/schedules - Get child's schedules
  static async getSchedules(req, res) {
    try {
      const { day } = req.query;
      
      const child = await Child.findOne({ 
        _id: req.params.id, 
        parent: req.user._id,
        isActive: true 
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child not found'
          }
        });
      }

      let schedules = child.getActiveSchedules(day);
      
      res.json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: {
          childId: child._id,
          childName: child.name,
          day: day || 'all',
          schedules: schedules
        }
      });
    } catch (error) {
      console.error('Get schedules error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_SCHEDULES_FAILED',
          message: 'Failed to retrieve schedules',
          details: error.message
        }
      });
    }
  }

  // GET /api/children/:id/today - Get child's schedules for today
  static async getTodaySchedules(req, res) {
    try {
      const child = await Child.findOne({ 
        _id: req.params.id, 
        parent: req.user._id,
        isActive: true 
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child not found'
          }
        });
      }

      const todaySchedules = child.getTodaysSchedules();
      
      res.json({
        success: true,
        message: 'Today\'s schedules retrieved successfully',
        data: {
          childId: child._id,
          childName: child.name,
          today: new Date().toLocaleDateString(),
          schedules: todaySchedules
        }
      });
    } catch (error) {
      console.error('Get today schedules error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_TODAY_SCHEDULES_FAILED',
          message: 'Failed to retrieve today\'s schedules',
          details: error.message
        }
      });
    }
  }

  // POST /api/children/:id/schedules - Add schedule to child
  static async addSchedule(req, res) {
    try {
      const { type, time, day, notes } = req.body;

      if (!type || !time || !day) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SCHEDULE_FIELDS',
            message: 'Type, time, and day are required'
          }
        });
      }

      const child = await Child.findOne({ 
        _id: req.params.id, 
        parent: req.user._id,
        isActive: true 
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CHILD_NOT_FOUND',
            message: 'Child not found'
          }
        });
      }

      await child.addSchedule({
        type,
        time,
        day,
        notes: notes || '',
        isActive: true
      });

      res.status(201).json({
        success: true,
        message: 'Schedule added successfully',
        data: {
          childId: child._id,
          schedules: child.schedules
        }
      });
    } catch (error) {
      console.error('Add schedule error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ADD_SCHEDULE_FAILED',
          message: 'Failed to add schedule',
          details: error.message
        }
      });
    }
  }

  // Utility method to validate schedules
  static validateSchedules(schedules) {
    if (!Array.isArray(schedules)) {
      return { isValid: false, error: 'Schedules must be an array' };
    }

    // Group schedules by day
    const schedulesByDay = {};
    schedules.forEach(schedule => {
      if (!schedulesByDay[schedule.day]) {
        schedulesByDay[schedule.day] = [];
      }
      schedulesByDay[schedule.day].push(schedule);
    });

    // Validate each day's schedules
    for (const [day, daySchedules] of Object.entries(schedulesByDay)) {
      const pickups = daySchedules.filter(s => s.type === 'pickup');
      const dropoffs = daySchedules.filter(s => s.type === 'dropoff');

      // Must have 1 or 2 pickups and 1 or 2 dropoffs per day
      if (pickups.length === 0 || dropoffs.length === 0) {
        return { 
          isValid: false, 
          error: `Each day must have at least one pickup and one dropoff schedule` 
        };
      }

      if (pickups.length > 2 || dropoffs.length > 2) {
        return { 
          isValid: false, 
          error: `Each day can have maximum 2 pickups and 2 dropoffs` 
        };
      }

      // Validate time format
      for (const schedule of daySchedules) {
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(schedule.time)) {
          return { 
            isValid: false, 
            error: `Invalid time format for ${schedule.day} ${schedule.type}. Use HH:mm format` 
          };
        }
      }
    }

    return { isValid: true };
  }

  // GET /api/children/nearby - Find children near a location (for drivers)
  static async getNearbyChildren(req, res) {
    try {
      const { longitude, latitude, radius = 1000 } = req.query;

      if (!longitude || !latitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_COORDINATES',
            message: 'Longitude and latitude are required'
          }
        });
      }

      const children = await Child.find({
        isActive: true,
        'pickupAddress.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(radius)
          }
        }
      })
        .populate('parent', 'firstName lastName phone')
        .populate('subscription.driver', 'firstName lastName phone')
        .lean();

      res.json({
        success: true,
        message: 'Nearby children retrieved successfully',
        data: {
          children: children.map(child => ({
            id: child._id,
            name: child.name,
            grade: child.grade,
            pickupAddress: child.pickupAddress,
            parent: child.parent,
            subscription: child.subscription,
            distance: 'Within ' + radius + 'm'
          }))
        }
      });
    } catch (error) {
      console.error('Get nearby children error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_NEARBY_CHILDREN_FAILED',
          message: 'Failed to retrieve nearby children',
          details: error.message
        }
      });
    }
  }
}

module.exports = ChildrenController;
