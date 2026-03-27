const School = require("../models/School");

class SchoolController {
  // GET /api/schools
  static async getAll(req, res) {
    try {
      const { city, search } = req.query;
      const filter = { isActive: true };

      if (city) filter["address.city"] = new RegExp(city, "i");

      let schools;
      if (search) {
        schools = await School.find({
          ...filter,
          $text: { $search: search },
        }).sort({ score: { $meta: "textScore" } });
      } else {
        schools = await School.find(filter).sort({ name: 1 });
      }

      res.json({
        success: true,
        data: { schools, total: schools.length },
      });
    } catch (error) {
      console.error("Get schools error:", error);
      res.status(500).json({
        success: false,
        error: { code: "FETCH_FAILED", message: "Failed to fetch schools" },
      });
    }
  }

  // GET /api/schools/:id
  static async getOne(req, res) {
    try {
      const school = await School.findById(req.params.id);

      if (!school) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "School not found" },
        });
      }

      res.json({ success: true, data: { school } });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: "FETCH_FAILED", message: "Failed to fetch school" },
      });
    }
  }

  // GET /api/schools/nearby
  static async findNearby(req, res) {
    try {
      const { latitude, longitude, radius } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Latitude and longitude are required",
          },
        });
      }

      const maxDistance = radius ? parseFloat(radius) * 1000 : 10000;
      const schools = await School.findNearby(
        parseFloat(longitude),
        parseFloat(latitude),
        maxDistance,
      );

      res.json({
        success: true,
        data: { schools, total: schools.length },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "SEARCH_FAILED",
          message: "Failed to find nearby schools",
        },
      });
    }
  }

  // POST /api/schools
  static async create(req, res) {
    try {
      const { name, latitude, longitude, address } = req.body;

      if (!name || !latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name, latitude, and longitude are required",
          },
        });
      }

      // Check duplicate
      const existing = await School.findOne({
        name: new RegExp(`^${name}$`, "i"),
        latitude: { $gte: latitude - 0.001, $lte: latitude + 0.001 },
        longitude: { $gte: longitude - 0.001, $lte: longitude + 0.001 },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: {
            code: "DUPLICATE_SCHOOL",
            message: "School already exists at this location",
          },
        });
      }

      const school = new School({
        name,
        latitude,
        longitude,
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        address: address || {},
        createdBy: req.user?._id,
      });
      await school.save();

      res.status(201).json({
        success: true,
        message: "School created successfully",
        data: { school },
      });
    } catch (error) {
      console.error("Create school error:", error);
      res.status(500).json({
        success: false,
        error: { code: "CREATE_FAILED", message: "Failed to create school" },
      });
    }
  }

  // PUT /api/schools/:id
  static async update(req, res) {
    try {
      const { name, latitude, longitude, address } = req.body;
      const updateData = { updatedBy: req.user?._id };

      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (latitude && longitude) {
        updateData.latitude = latitude;
        updateData.longitude = longitude;
        updateData.location = {
          type: "Point",
          coordinates: [longitude, latitude],
        };
      }

      const school = await School.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "School not found" },
        });
      }

      res.json({
        success: true,
        message: "School updated successfully",
        data: { school },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: "UPDATE_FAILED", message: "Failed to update school" },
      });
    }
  }

  // DELETE /api/schools/:id
  static async delete(req, res) {
    try {
      const school = await School.findByIdAndDelete(req.params.id);

      if (!school) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "School not found" },
        });
      }

      res.json({ success: true, message: "School deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: "DELETE_FAILED", message: "Failed to delete school" },
      });
    }
  }

  // PATCH /api/schools/:id/status
  static async toggleStatus(req, res) {
    try {
      const { isActive } = req.body;

      const school = await School.findByIdAndUpdate(
        req.params.id,
        { isActive, updatedBy: req.user?._id },
        { new: true },
      );

      if (!school) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "School not found" },
        });
      }

      res.json({
        success: true,
        message: `School ${isActive ? "activated" : "deactivated"} successfully`,
        data: { school },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "UPDATE_FAILED",
          message: "Failed to update school status",
        },
      });
    }
  }
}

module.exports = SchoolController;
