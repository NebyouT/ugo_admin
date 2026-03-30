const Child = require("../models/Child");

class ChildrenController {
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, active = true } = req.query;

      const children = await Child.find({
        parent: req.user._id,
        isActive: active === "true",
      })
        .populate("school", "name address")
        .populate("subscription.driver", "fullName phone")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Child.countDocuments({
        parent: req.user._id,
        isActive: active === "true",
      });

      res.json({
        success: true,
        data: {
          children: children.map(ChildrenController._format),
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Get children error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "GET_CHILDREN_FAILED",
          message: "Failed to retrieve children",
        },
      });
    }
  }

  // GET /api/children/:id
  static async getById(req, res) {
    try {
      const child = await Child.findOne({
        _id: req.params.id,
        parent: req.user._id,
        isActive: true,
      })
        .populate("school", "name address")
        .populate("subscription.driver", "fullName phone")
        .lean();

      if (!child) {
        return res.status(404).json({
          success: false,
          error: { code: "CHILD_NOT_FOUND", message: "Child not found" },
        });
      }

      res.json({
        success: true,
        data: { child: ChildrenController._format(child) },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "GET_CHILD_FAILED",
          message: "Failed to retrieve child",
        },
      });
    }
  }

  // POST /api/children
  static async create(req, res) {
    try {
      const {
        name,
        grade,
        pickup_address, // string address
        school_name, // free text school/destination name
        school, // optional ObjectId if available
        vehicle_type,
        start_date,
      } = req.body;

      // Validate required fields
      if (!name || !grade || !pickup_address) {
        return res.status(400).json({
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Name, grade, and pickup address are required",
          },
        });
      }

      const child = new Child({
        parent: req.user._id,
        createdBy: req.user._id,
        name: name.trim(),
        grade: grade.trim(),
        pickupAddress: {
          address: pickup_address.trim(),
          coordinates: {
            type: "Point",
            coordinates: [0, 0], // updated later when location is picked on map
          },
        },
        schoolName: school_name?.trim() || "",
        school: school || null,
        vehicleType: vehicle_type || "any",
        subscription: {
          startDate: start_date ? new Date(start_date) : null,
          status: start_date ? "pending" : "inactive",
        },
      });

      await child.save();

      res.status(201).json({
        success: true,
        message: "Child added successfully",
        data: { child: ChildrenController._format(child.toObject()) },
      });
    } catch (error) {
      console.error("Create child error:", error);

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: errors.join(", ") },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: "CREATE_CHILD_FAILED",
          message: "Failed to create child",
        },
      });
    }
  }

  // PUT /api/children/:id
  static async update(req, res) {
    try {
      const child = await Child.findOne({
        _id: req.params.id,
        parent: req.user._id,
        isActive: true,
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: { code: "CHILD_NOT_FOUND", message: "Child not found" },
        });
      }

      const {
        name,
        grade,
        pickup_address,
        school_name,
        school,
        vehicle_type,
        start_date,
      } = req.body;

      if (name) child.name = name.trim();
      if (grade) child.grade = grade.trim();
      if (pickup_address) child.pickupAddress.address = pickup_address.trim();
      if (school_name) child.schoolName = school_name.trim();
      if (school) child.school = school;
      if (vehicle_type) child.vehicleType = vehicle_type;
      if (start_date) child.subscription.startDate = new Date(start_date);

      child.updatedBy = req.user._id;
      await child.save();

      res.json({
        success: true,
        message: "Child updated successfully",
        data: { child: ChildrenController._format(child.toObject()) },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "UPDATE_CHILD_FAILED",
          message: "Failed to update child",
        },
      });
    }
  }

  // DELETE /api/children/:id
  static async delete(req, res) {
    try {
      const child = await Child.findOne({
        _id: req.params.id,
        parent: req.user._id,
        isActive: true,
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: { code: "CHILD_NOT_FOUND", message: "Child not found" },
        });
      }

      child.isActive = false;
      child.updatedBy = req.user._id;
      await child.save();

      res.json({ success: true, message: "Child deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "DELETE_CHILD_FAILED",
          message: "Failed to delete child",
        },
      });
    }
  }

  static _format(child) {
    return {
      id: child._id,
      name: child.name,
      grade: child.grade,
      pickup_address: child.pickupAddress?.address,
      school_name: child.schoolName,
      school: child.school,
      vehicle_type: child.vehicleType,
      subscription: {
        status: child.subscription?.status,
        start_date: child.subscription?.startDate,
        end_date: child.subscription?.endDate,
        driver: child.subscription?.driver,
      },
      created_at: child.createdAt,
      updated_at: child.updatedAt,
    };
  }
}

module.exports = ChildrenController;
