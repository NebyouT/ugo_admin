const Group = require('../models/Group');
const School = require('../../schools/models/School');
const User = require('../../user-management/models/User');

class GroupsController {
  // 21. POST /groups/search - Search Groups by School & Location
  static async searchGroups(req, res) {
    try {
      const { school_id, pickup_location, preferred_time } = req.body;
      
      // Validation
      if (!school_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'School ID is required'
          }
        });
      }
      
      // Check if school exists
      const school = await School.findById(school_id);
      if (!school) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SCHOOL',
            message: 'School not found'
          }
        });
      }
      
      // Search groups
      const groups = await Group.searchGroups({
        school_id,
        pickup_location,
        preferred_time
      });
      
      // Format response with estimated prices
      const formattedGroups = groups.map(group => {
        const groupData = group.toJSON();
        
        // Calculate estimated price if pickup location provided
        if (pickup_location) {
          groupData.estimated_price = group.calculatePrice(pickupLocation).total_price;
        } else {
          groupData.estimated_price = group.base_price;
        }
        
        // Add voting info if no driver assigned
        if (!group.driver && group.voting.status === 'active') {
          groupData.voting = {
            status: group.voting.status,
            deadline: group.voting.deadline
          };
        }
        
        return groupData;
      });
      
      res.json({
        success: true,
        data: {
          groups: formattedGroups,
          total: formattedGroups.length,
          suggestion: formattedGroups.length === 0 ? 'You can request a new group' : undefined
        }
      });
    } catch (error) {
      console.error('Search groups error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search groups'
        }
      });
    }
  }
  
  // 22. GET /groups - Get All Available Groups
  static async getAllGroups(req, res) {
    try {
      const { school_id, status, page = 1, limit = 10 } = req.query;
      
      // Build query
      const query = { isDeleted: false, isActive: true };
      
      if (school_id) query.school = school_id;
      if (status) query.status = status;
      
      // Pagination
      const skip = (page - 1) * limit;
      
      // Get groups
      const groups = await Group.find(query)
        .populate('driver', 'name email phone rating photo')
        .populate('school', 'name address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get total count
      const total = await Group.countDocuments(query);
      
      // Format response
      const formattedGroups = groups.map(group => {
        const groupData = group.toJSON();
        delete groupData.voting; // Hide voting in list view
        return groupData;
      });
      
      res.json({
        success: true,
        data: {
          groups: formattedGroups,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all groups error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch groups'
        }
      });
    }
  }
  
  // 23. GET /groups/{id} - Get Group Detail
  static async getGroupDetail(req, res) {
    try {
      const { id } = req.params;
      
      const group = await Group.findById(id)
        .populate('driver', 'name email phone rating photo')
        .populate('school', 'name address start_time end_time');
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }
      
      const groupData = group.toJSON();
      
      // Add driver vehicle info if driver exists
      if (group.driver) {
        // In production, this would populate driver's vehicle details
        groupData.driver.vehicle = {
          type: 'Bajaj',
          color: 'Blue',
          plate: '3-12345'
        };
      }
      
      // Add voting candidates if voting is active
      if (!group.driver && group.voting.status === 'active') {
        // In production, this would populate driver details for candidates
        groupData.voting.candidates = group.voting.candidates.map(candidate => ({
          driver_id: candidate.driver_id,
          name: 'Driver Name', // Would populate from User model
          rating: 4.5,
          votes: candidate.votes
        }));
      }
      
      res.json({
        success: true,
        data: {
          group: groupData
        }
      });
    } catch (error) {
      console.error('Get group detail error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch group details'
        }
      });
    }
  }
  
  // 24. GET /groups/{id}/driver - Get Group Driver Info
  static async getGroupDriver(req, res) {
    try {
      const { id } = req.params;
      
      const group = await Group.findById(id).populate('driver');
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }
      
      if (!group.driver) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_DRIVER_ASSIGNED',
            message: 'This group has no driver assigned yet. Voting is in progress.'
          }
        });
      }
      
      // Get detailed driver info
      const driver = await User.findById(group.driver._id);
      
      // Mock driver details (in production, this would come from DriverDetail model)
      const driverData = {
        id: driver._id,
        full_name: driver.name,
        phone: driver.phone || '0933456789',
        photo: 'https://storage.ugo.et/drivers/driver_001.jpg',
        rating: {
          overall: 4.8,
          safety: 4.9,
          punctuality: 4.7,
          communication: 4.6,
          total_reviews: 45
        },
        experience: {
          total_rides: 120,
          total_students: 25,
          member_since: '2025-06-15'
        },
        vehicle: {
          type: 'Bajaj',
          color: 'Blue',
          plate: '3-12345',
          capacity: 8,
          photo: 'https://storage.ugo.et/vehicles/vehicle_001.jpg'
        },
        reviews: [
          {
            id: 'review_001',
            parent_name: 'Meron H.',
            rating: 5.0,
            comment: 'Very punctual and safe!',
            created_at: '2026-02-20T10:00:00Z'
          }
        ]
      };
      
      res.json({
        success: true,
        data: {
          driver: driverData
        }
      });
    } catch (error) {
      console.error('Get group driver error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch driver information'
        }
      });
    }
  }
  
  // 25. GET /groups/{id}/availability - Check Spots Available
  static async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      
      const group = await Group.findById(id).populate('school', 'name');
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }
      
      const availability = {
        group_id: group._id,
        group_name: group.name,
        capacity: group.capacity,
        current_members: group.current_members,
        spots_left: group.spots_left,
        is_available: group.is_available,
        status: group.status
      };
      
      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      console.error('Check availability error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CHECK_FAILED',
          message: 'Failed to check availability'
        }
      });
    }
  }
  
  // 26. GET /groups/{id}/schedule - Get Pickup/Drop Schedule
  static async getGroupSchedule(req, res) {
    try {
      const { id } = req.params;
      
      const group = await Group.findById(id).populate('school', 'name address start_time end_time');
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }
      
      const scheduleData = {
        group_id: group._id,
        group_name: group.name,
        school: {
          id: group.school._id,
          name: group.school.name,
          start_time: group.school.start_time || '08:00',
          end_time: group.school.end_time || '16:00'
        },
        schedule: {
          morning: {
            type: 'pickup',
            start_time: group.schedule.pickup_time,
            arrival_at_school: '07:50' // Calculate based on pickup time
          },
          afternoon: {
            type: 'drop',
            start_time: group.schedule.drop_time,
            end_time: '17:00' // Calculate based on drop time
          }
        },
        days: group.schedule.days
      };
      
      res.json({
        success: true,
        data: scheduleData
      });
    } catch (error) {
      console.error('Get schedule error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch schedule'
        }
      });
    }
  }
  
  // 27. GET /groups/{id}/price-estimate - Get Price for My Location
  static async getPriceEstimate(req, res) {
    try {
      const { id } = req.params;
      const { address, lat, lng } = req.query;
      
      if (!address || !lat || !lng) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Address, latitude, and longitude are required'
          }
        });
      }
      
      const group = await Group.findById(id);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'GROUP_NOT_FOUND',
            message: 'Group not found'
          }
        });
      }
      
      // Calculate distance (simplified - in production use Google Maps API)
      const groupLocation = {
        lat: 9.0192, // Default Addis Ababa coordinates
        lng: 38.7525
      };
      
      const userLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
      
      // Simple distance calculation
      const distance = calculateDistance(groupLocation, userLocation);
      const maxDistance = 5; // 5 km max
      
      if (distance > maxDistance) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LOCATION_TOO_FAR',
            message: 'Your location is too far from this group\'s route'
          },
          data: {
            max_distance_km: maxDistance,
            your_distance_km: distance
          }
        });
      }
      
      // Calculate pricing
      const pricing = group.calculatePrice({
        address,
        lat: userLocation.lat,
        lng: userLocation.lng
      });
      
      const priceData = {
        group_id: group._id,
        group_name: group.name,
        pickup_location: {
          address
        },
        pricing
      };
      
      res.json({
        success: true,
        data: priceData
      });
    } catch (error) {
      console.error('Get price estimate error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CALCULATION_FAILED',
          message: 'Failed to calculate price estimate'
        }
      });
    }
  }
  
  // Create a new group
  static async create(req, res) {
    try {
      const {
        name,
        school,
        schedule,
        capacity,
        base_price,
        service_radius,
        description
      } = req.body;
      
      // Validation
      if (!name || !school || !schedule || !capacity || !base_price) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name, school, schedule, capacity, and base price are required'
          }
        });
      }
      
      // Validate schedule
      if (!schedule.pickup_time || !schedule.drop_time) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Pickup and drop times are required'
          }
        });
      }
      
      // Check if school exists
      const School = require('../../schools/models/School');
      const schoolExists = await School.findById(school);
      if (!schoolExists) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SCHOOL',
            message: 'School not found'
          }
        });
      }
      
      const groupData = {
        name,
        school,
        schedule: {
          pickup_time: schedule.pickup_time,
          drop_time: schedule.drop_time,
          days: schedule.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        capacity: parseInt(capacity),
        base_price: parseFloat(base_price),
        current_members: 0,
        status: 'open',
        createdBy: req.user?._id
      };
      
      if (service_radius) groupData.service_radius = parseFloat(service_radius);
      if (description) groupData.description = description;
      
      const group = new Group(groupData);
      await group.save();
      
      // Populate school info for response
      await group.populate('school', 'name address');
      
      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: { group }
      });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: 'Failed to create group'
        }
      });
    }
  }
  
  // Update a group
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Add updatedBy
      updateData.updatedBy = req.user?._id;
      
      // Validate schedule if provided
      if (updateData.schedule) {
        if (!updateData.schedule.pickup_time || !updateData.schedule.drop_time) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Pickup and drop times are required'
            }
          });
        }
      }
      
      // Validate capacity if provided
      if (updateData.capacity) {
        updateData.capacity = parseInt(updateData.capacity);
        if (updateData.capacity < 1 || updateData.capacity > 15) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Capacity must be between 1 and 15'
            }
          });
        }
      }
      
      // Validate base_price if provided
      if (updateData.base_price) {
        updateData.base_price = parseFloat(updateData.base_price);
        if (updateData.base_price < 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Base price cannot be negative'
            }
          });
        }
      }
      
      const group = await Group.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('school', 'name address');
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Group not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Group updated successfully',
        data: { group }
      });
    } catch (error) {
      console.error('Update group error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update group'
        }
      });
    }
  }
  
  // Delete a group
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const group = await Group.findByIdAndDelete(id);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Group not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Group deleted successfully'
      });
    } catch (error) {
      console.error('Delete group error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete group'
        }
      });
    }
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = GroupsController;
