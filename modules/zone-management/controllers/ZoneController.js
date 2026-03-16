const Zone = require('../models/Zone');

class ZoneController {
  // Get all zones with pagination
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search, active } = req.query;
      const skip = (page - 1) * limit;
      
      // Build filter
      const filter = { isDeleted: false };
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (active !== undefined) {
        filter.is_active = active === 'true';
      }
      
      const zones = await Zone.find(filter)
        .sort({ readable_id: 1, name: 1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Zone.countDocuments(filter);
      
      res.json({
        success: true,
        message: 'Zones retrieved successfully',
        data: {
          zones,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get zones error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch zones'
        }
      });
    }
  }
  
  // Get single zone
  static async getOne(req, res) {
    try {
      const { id } = req.params;
      
      const zone = await Zone.findOne({ 
        _id: id, 
        isDeleted: false 
      });
      
      if (!zone) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Zone not found'
          }
        });
      }
      
      res.json({
        success: true,
        data: { zone }
      });
    } catch (error) {
      console.error('Get zone error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch zone'
        }
      });
    }
  }
  
  // Create new zone
  static async create(req, res) {
    try {
      const {
        name,
        coordinates,
        description,
        service_radius,
        extra_fare_status,
        extra_fare_fee,
        extra_fare_reason,
        color
      } = req.body;
      
      // Validation
      if (!name) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Zone name is required'
          }
        });
      }
      
      // Handle Laravel-style coordinate format: "(lng1,lat1),(lng2,lat2),(lng3,lat3)"
      let processedCoordinates = coordinates;
      
      // If coordinates is a string (Laravel format), process it
      if (typeof coordinates === 'string') {
        processedCoordinates = ZoneController.processLaravelCoordinates(coordinates);
        if (!processedCoordinates) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid coordinate format. Use format: (lng,lat),(lng,lat),(lng,lat)'
            }
          });
        }
      }
      
      // Validate coordinates
      if (!processedCoordinates || !processedCoordinates.coordinates || processedCoordinates.coordinates.length < 3) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Zone coordinates are required (minimum 3 points)'
          }
        });
      }
      
      // Check for duplicate zone name
      const existingZone = await Zone.findOne({ 
        name: new RegExp(`^${name}$`, 'i'), 
        isDeleted: false 
      });
      
      if (existingZone) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_ZONE',
            message: 'Zone with this name already exists'
          }
        });
      }
      
      const zoneData = {
        name,
        coordinates: processedCoordinates,
        description: description || '',
        service_radius: parseFloat(service_radius) || 5,
        extra_fare_status: extra_fare_status || false,
        extra_fare_fee: parseFloat(extra_fare_fee) || 0,
        extra_fare_reason: extra_fare_reason || '',
        color: color || '#667eea',
        createdBy: req.user?._id
      };
      
      const zone = new Zone(zoneData);
      await zone.save();
      
      res.status(201).json({
        success: true,
        message: 'Zone created successfully',
        data: { zone }
      });
    } catch (error) {
      console.error('Create zone error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: 'Failed to create zone'
        }
      });
    }
  }
  
  // Laravel-style coordinate processing
  static processLaravelCoordinates(coordinatesString) {
    try {
      // Remove parentheses and split by comma
      const cleaned = coordinatesString.replace(/[()]/g, '');
      const points = cleaned.split('),(');
      
      const polygonCoords = points.map(point => {
        const [lng, lat] = point.split(',').map(coord => parseFloat(coord.trim()));
        return [lng, lat];
      });
      
      // Close the polygon by adding the first point at the end
      if (polygonCoords.length >= 3) {
        polygonCoords.push(polygonCoords[0]);
      }
      
      return {
        type: 'Polygon',
        coordinates: [polygonCoords]
      };
    } catch (error) {
      console.error('Error processing Laravel coordinates:', error);
      return null;
    }
  }
  
  // Update zone
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Add updatedBy
      updateData.updatedBy = req.user?._id;
      
      // Validate coordinates if provided
      if (updateData.coordinates && updateData.coordinates.coordinates) {
        updateData.coordinates = {
          type: 'Polygon',
          coordinates: updateData.coordinates.coordinates
        };
      }
      
      // Validate service radius if provided
      if (updateData.service_radius) {
        updateData.service_radius = parseFloat(updateData.service_radius);
        if (updateData.service_radius < 0.1 || updateData.service_radius > 50) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Service radius must be between 0.1 and 50 km'
            }
          });
        }
      }
      
      // Validate extra fare fee if provided
      if (updateData.extra_fare_fee) {
        updateData.extra_fare_fee = parseFloat(updateData.extra_fare_fee);
        if (updateData.extra_fare_fee < 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Extra fare fee cannot be negative'
            }
          });
        }
      }
      
      const zone = await Zone.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!zone) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Zone not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Zone updated successfully',
        data: { zone }
      });
    } catch (error) {
      console.error('Update zone error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update zone'
        }
      });
    }
  }
  
  // Delete zone (soft delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const zone = await Zone.findById(id);
      
      if (!zone) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Zone not found'
          }
        });
      }
      
      // Soft delete
      zone.isDeleted = true;
      zone.deletedAt = new Date();
      zone.deletedBy = req.user?._id;
      zone.is_active = false;
      
      await zone.save();
      
      res.json({
        success: true,
        message: 'Zone deleted successfully'
      });
    } catch (error) {
      console.error('Delete zone error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete zone'
        }
      });
    }
  }
  
  // Toggle zone status
  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      const zone = await Zone.findByIdAndUpdate(
        id,
        { 
          is_active,
          updatedBy: req.user?._id
        },
        { new: true }
      );
      
      if (!zone) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Zone not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: `Zone ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: { zone }
      });
    } catch (error) {
      console.error('Toggle status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update zone status'
        }
      });
    }
  }
  
  // Get zone statistics
  static async getStats(req, res) {
    try {
      const stats = await Zone.getStats();
      
      res.json({
        success: true,
        data: {
          stats
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: 'Failed to fetch zone statistics'
        }
      });
    }
  }
  
  // Search zones by location
  static async searchByLocation(req, res) {
    try {
      const { latitude, longitude, radius = 10000 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude and longitude are required'
          }
        });
      }
      
      const zones = await Zone.findByCoordinates(
        parseFloat(longitude),
        parseFloat(latitude),
        parseInt(radius)
      );
      
      res.json({
        success: true,
        message: 'Zones found by location',
        data: {
          zones,
          center: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            radius: parseInt(radius) / 1000 // Convert to km
          },
          total: zones.length
        }
      });
    } catch (error) {
      console.error('Search by location error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search zones by location'
        }
      });
    }
  }
  
  // Check if point is within zone
  static async checkPointInZone(req, res) {
    try {
      const { latitude, longitude, zoneId } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude and longitude are required'
          }
        });
      }
      
      let zones;
      
      if (zoneId) {
        const zone = await Zone.findOne({ _id: zoneId, is_active: true, isDeleted: false });
        zones = zone ? [zone] : [];
      } else {
        zones = await Zone.findActive();
      }
      
      const results = zones.map(zone => ({
        zoneId: zone._id,
        zoneName: zone.name,
        isWithin: zone.containsPoint(parseFloat(longitude), parseFloat(latitude)),
        zoneColor: zone.color
      }));
      
      res.json({
        success: true,
        message: 'Zone check completed',
        data: {
          results,
          total: results.length,
          point: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
        }
      });
    } catch (error) {
      console.error('Check point in zone error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CHECK_FAILED',
          message: 'Failed to check point in zone'
        }
      });
    }
  }
}

module.exports = ZoneController;
