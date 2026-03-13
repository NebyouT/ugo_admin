const School = require('../models/School');
const GoogleMapsService = require('../../integrations/services/GoogleMapsService');

class SchoolController {
  // Get all schools
  static async getAll(req, res) {
    try {
      const { city, type, search, active } = req.query;
      const filter = {};
      
      if (city) filter['address.city'] = new RegExp(city, 'i');
      if (type) filter.type = type;
      if (active !== undefined) filter.isActive = active === 'true';
      
      let schools;
      
      if (search) {
        schools = await School.find({
          ...filter,
          $text: { $search: search }
        }).sort({ score: { $meta: 'textScore' } });
      } else {
        schools = await School.find(filter).sort({ name: 1 });
      }
      
      res.json({
        success: true,
        data: {
          schools,
          total: schools.length
        }
      });
    } catch (error) {
      console.error('Get schools error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch schools'
        }
      });
    }
  }
  
  // Get single school
  static async getOne(req, res) {
    try {
      const { id } = req.params;
      
      const school = await School.findById(id);
      
      if (!school) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'School not found'
          }
        });
      }
      
      res.json({
        success: true,
        data: { school }
      });
    } catch (error) {
      console.error('Get school error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch school'
        }
      });
    }
  }
  
  // Find nearby schools
  static async findNearby(req, res) {
    try {
      const { latitude, longitude, radius } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude and longitude are required'
          }
        });
      }
      
      const maxDistance = radius ? parseFloat(radius) * 1000 : 10000; // Convert km to meters
      
      const schools = await School.findNearby(
        parseFloat(longitude),
        parseFloat(latitude),
        maxDistance
      );
      
      res.json({
        success: true,
        data: {
          schools,
          total: schools.length,
          center: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          },
          radius: maxDistance / 1000
        }
      });
    } catch (error) {
      console.error('Find nearby error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to find nearby schools'
        }
      });
    }
  }
  
  // Create school
  static async create(req, res) {
    try {
      const {
        name,
        latitude,
        longitude,
        address,
        contactInfo,
        type,
        grades,
        studentCapacity,
        operatingHours,
        serviceRadius,
        description,
        facilities
      } = req.body;
      
      // Validation
      if (!name) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name is required'
          }
        });
      }
      
      let finalLat = latitude;
      let finalLng = longitude;
      let formattedAddress = address?.formattedAddress;
      
      // If only address is provided, geocode it
      if (!latitude || !longitude) {
        if (!address || !address.street) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Either coordinates or street address is required'
            }
          });
        }
        
        try {
          const geocodeResult = await GoogleMapsService.geocode(
            `${address.street}, ${address.city || 'Addis Ababa'}, ${address.country || 'Ethiopia'}`
          );
          
          if (geocodeResult.success) {
            finalLat = geocodeResult.location.lat;
            finalLng = geocodeResult.location.lng;
            formattedAddress = geocodeResult.formattedAddress;
          } else {
            return res.status(400).json({
              success: false,
              error: {
                code: 'GEOCODING_FAILED',
                message: 'Could not geocode the provided address'
              }
            });
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'GEOCODING_ERROR',
              message: 'Geocoding failed: ' + error.message
            }
          });
        }
      }
      
      // Check if school already exists at this location
      const existingSchool = await School.findOne({
        name: new RegExp(`^${name}$`, 'i'),
        latitude: { $gte: latitude - 0.001, $lte: latitude + 0.001 },
        longitude: { $gte: longitude - 0.001, $lte: longitude + 0.001 }
      });
      
      if (existingSchool) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_SCHOOL',
            message: 'A school with this name already exists at this location'
          }
        });
      }
      
      const schoolData = {
        name,
        latitude: finalLat,
        longitude: finalLng,
        location: {
          type: 'Point',
          coordinates: [finalLng, finalLat]
        },
        createdBy: req.user?._id
      };
      
      if (address) {
        schoolData.address = address;
        if (formattedAddress) {
          schoolData.address.formattedAddress = formattedAddress;
        }
      }
      if (contactInfo) schoolData.contactInfo = contactInfo;
      if (type) schoolData.type = type;
      if (grades) schoolData.grades = grades;
      if (studentCapacity) schoolData.studentCapacity = studentCapacity;
      if (operatingHours) schoolData.operatingHours = operatingHours;
      if (serviceRadius) schoolData.serviceRadius = serviceRadius;
      if (description) schoolData.description = description;
      if (facilities) schoolData.facilities = facilities;
      
      const school = new School(schoolData);
      await school.save();
      
      res.status(201).json({
        success: true,
        message: 'School created successfully',
        data: { school }
      });
    } catch (error) {
      console.error('Create school error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: 'Failed to create school'
        }
      });
    }
  }
  
  // Update school
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Add updatedBy
      updateData.updatedBy = req.user?._id;
      
      // If latitude/longitude changed, update location
      if (updateData.latitude && updateData.longitude) {
        updateData.location = {
          type: 'Point',
          coordinates: [updateData.longitude, updateData.latitude]
        };
      }
      
      const school = await School.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!school) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'School not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: 'School updated successfully',
        data: { school }
      });
    } catch (error) {
      console.error('Update school error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update school'
        }
      });
    }
  }
  
  // Delete school
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const school = await School.findByIdAndDelete(id);
      
      if (!school) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'School not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: 'School deleted successfully'
      });
    } catch (error) {
      console.error('Delete school error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete school'
        }
      });
    }
  }
  
  // Toggle school status
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const school = await School.findByIdAndUpdate(
        id,
        { isActive, updatedBy: req.user?._id },
        { new: true }
      );
      
      if (!school) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'School not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: `School ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { school }
      });
    } catch (error) {
      console.error('Toggle status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update school status'
        }
      });
    }
  }
  
  // Search nearby schools using Google Places API
  static async searchNearbyPlaces(req, res) {
    try {
      const { latitude, longitude, radius = 5000, keyword = 'school' } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude and longitude are required'
          }
        });
      }
      
      try {
        const placesResult = await GoogleMapsService.searchPlaces(
          parseFloat(latitude),
          parseFloat(longitude),
          parseInt(radius),
          keyword
        );
        
        res.json({
          success: true,
          data: {
            places: placesResult.results,
            total: placesResult.results.length,
            center: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            },
            radius: parseInt(radius),
            keyword
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PLACES_SEARCH_FAILED',
            message: error.message
          }
        });
      }
    } catch (error) {
      console.error('Search nearby places error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search nearby places'
        }
      });
    }
  }

  // Get school statistics
  static async getStats(req, res) {
    try {
      const totalSchools = await School.countDocuments();
      const activeSchools = await School.countDocuments({ isActive: true });
      const schoolsByType = await School.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
      const schoolsByCity = await School.aggregate([
        { $group: { _id: '$address.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      res.json({
        success: true,
        data: {
          total: totalSchools,
          active: activeSchools,
          inactive: totalSchools - activeSchools,
          byType: schoolsByType,
          byCity: schoolsByCity
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: 'Failed to fetch statistics'
        }
      });
    }
  }
}

module.exports = SchoolController;
