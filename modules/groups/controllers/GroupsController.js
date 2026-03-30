const Group = require("../models/Group");
const School = require("../../schools/models/School");
const Child = require("../../children/models/Child");
const User = require("../../user-management/models/User");

const VEHICLE_CAPACITIES = {
  bajaj: 3,
  force: 5,
  electric: 4,
};

class GroupsController {
  // POST /api/groups/search
  // Finds groups going to the same school
  // whose pickup_location is within radius_meters of the parent's location
  static async searchGroups(req, res) {
    try {
      const {
        school_id,
        latitude,
        longitude,
        radius_meters = 500,
        vehicle_type,
      } = req.body;

      if (!school_id) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "school_id is required" },
        });
      }

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "latitude and longitude are required",
          },
        });
      }

      // Verify school exists
      const school = await School.findById(school_id);
      if (!school) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_SCHOOL", message: "School not found" },
        });
      }

      // Geospatial query:
      // 1. Same school
      // 2. Group's pickup_location is within radius_meters of the parent's location
      // 3. Status is open (has spots)
      const query = {
        isDeleted: false,
        isActive: true,
        status: "open",
        school: school_id,
        pickup_location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: parseInt(radius_meters),
          },
        },
      };

      if (vehicle_type) query.vehicle_type = vehicle_type;

      const groups = await Group.find(query)
        .populate("driver", "fullName phone")
        .populate("school", "name address")
        .populate("members.child", "name grade")
        .populate("members.parent", "fullName phone");

      const formattedGroups = groups.map((group) => ({
        id: group._id,
        name: group.name,
        school: group.school,
        vehicle_type: group.vehicle_type,
        capacity: group.capacity,
        current_members: group.current_members,
        spots_left: group.spots_left,
        is_available: group.is_available,
        base_price: group.base_price,
        pickup_address: group.pickup_address,
        pickup_location: group.pickup_location,
        pickup_radius: group.pickup_radius,
        driver: group.driver,
        status: group.status,
        members: group.members
          .filter((m) => m.status === "active")
          .map((m) => ({
            child: m.child,
            parent: m.parent,
            joined_at: m.joined_at,
          })),
      }));

      res.json({
        success: true,
        data: {
          groups: formattedGroups,
          total: formattedGroups.length,
          search_info: {
            school: school.name,
            radius_meters,
            coordinates: { latitude, longitude },
          },
          suggestion:
            formattedGroups.length === 0
              ? "No groups found near your location for this school. A new group can be created."
              : undefined,
        },
      });
    } catch (error) {
      console.error("Search groups error:", error);
      res.status(500).json({
        success: false,
        error: { code: "SEARCH_FAILED", message: "Failed to search groups" },
      });
    }
  }

  // POST /api/groups/:id/join
  // Parent joins their child to a group
  static async joinGroup(req, res) {
    try {
      const { id } = req.params;
      const { child_id } = req.body;
      const parentId = req.user._id;

      if (!child_id) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "child_id is required" },
        });
      }

      // Check group exists
      const group = await Group.findById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: "GROUP_NOT_FOUND", message: "Group not found" },
        });
      }

      // Check group is open
      if (group.status !== "open") {
        return res.status(400).json({
          success: false,
          error: {
            code: "GROUP_NOT_OPEN",
            message: "This group is not accepting new members",
          },
        });
      }

      // Check child belongs to this parent
      const child = await Child.findOne({ _id: child_id, parent: parentId });
      if (!child) {
        return res.status(404).json({
          success: false,
          error: {
            code: "CHILD_NOT_FOUND",
            message: "Child not found or does not belong to you",
          },
        });
      }

      // Add member using model method
      await group.addMember(child_id, parentId);

      await group.populate("members.child", "name grade");
      await group.populate("members.parent", "fullName phone");

      res.json({
        success: true,
        message: "Successfully joined the group",
        data: {
          group_id: group._id,
          group_name: group.name,
          child: { id: child._id, name: child.name },
          spots_left: group.spots_left,
          status: group.status,
        },
      });
    } catch (error) {
      console.error("Join group error:", error);
      if (
        error.message === "Group is full" ||
        error.message === "Child is already a member of this group"
      ) {
        return res.status(400).json({
          success: false,
          error: { code: "JOIN_FAILED", message: error.message },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: "JOIN_FAILED", message: "Failed to join group" },
      });
    }
  }

  // POST /api/groups/:id/leave
  // Parent removes their child from a group
  static async leaveGroup(req, res) {
    try {
      const { id } = req.params;
      const { child_id } = req.body;
      const parentId = req.user._id;

      if (!child_id) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "child_id is required" },
        });
      }

      const group = await Group.findById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: "GROUP_NOT_FOUND", message: "Group not found" },
        });
      }

      // Verify child belongs to parent
      const child = await Child.findOne({ _id: child_id, parent: parentId });
      if (!child) {
        return res.status(404).json({
          success: false,
          error: {
            code: "CHILD_NOT_FOUND",
            message: "Child not found or does not belong to you",
          },
        });
      }

      await group.removeMember(child_id);

      res.json({
        success: true,
        message: "Successfully left the group",
        data: {
          group_id: group._id,
          group_name: group.name,
          child: { id: child._id, name: child.name },
          spots_left: group.spots_left,
          status: group.status,
        },
      });
    } catch (error) {
      console.error("Leave group error:", error);
      if (error.message === "Child is not an active member of this group") {
        return res.status(400).json({
          success: false,
          error: { code: "LEAVE_FAILED", message: error.message },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: "LEAVE_FAILED", message: "Failed to leave group" },
      });
    }
  }

  // GET /api/groups/vehicle-types
  static async getVehicleTypes(req, res) {
    res.json({
      success: true,
      data: {
        vehicle_types: Object.entries(VEHICLE_CAPACITIES).map(
          ([type, max]) => ({
            type,
            max_capacity: max,
            label: type.charAt(0).toUpperCase() + type.slice(1),
          }),
        ),
      },
    });
  }

  // GET /api/groups
  static async getAllGroups(req, res) {
    try {
      const {
        school_id,
        status,
        vehicle_type,
        page = 1,
        limit = 10,
      } = req.query;
      const query = { isDeleted: false, isActive: true };

      if (school_id) query.school = school_id;
      if (status) query.status = status;
      if (vehicle_type) query.vehicle_type = vehicle_type;

      const skip = (page - 1) * limit;
      const groups = await Group.find(query)
        .populate("driver", "fullName phone")
        .populate("school", "name address")
        .populate("members.child", "name grade")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Group.countDocuments(query);

      res.json({
        success: true,
        data: {
          groups,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            total_items: total,
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Get all groups error:", error);
      res.status(500).json({
        success: false,
        error: { code: "FETCH_FAILED", message: "Failed to fetch groups" },
      });
    }
  }

  // GET /api/groups/:id
  static async getGroupDetail(req, res) {
    try {
      const group = await Group.findById(req.params.id)
        .populate("driver", "fullName phone")
        .populate("school", "name address")
        .populate("members.child", "name grade")
        .populate("members.parent", "fullName phone");

      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: "GROUP_NOT_FOUND", message: "Group not found" },
        });
      }

      res.json({ success: true, data: { group } });
    } catch (error) {
      console.error("Get group detail error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: "Failed to fetch group details",
        },
      });
    }
  }

  // GET /api/groups/:id/driver
  static async getGroupDriver(req, res) {
    try {
      const group = await Group.findById(req.params.id).populate("driver");
      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: "GROUP_NOT_FOUND", message: "Group not found" },
        });
      }
      if (!group.driver) {
        return res.status(400).json({
          success: false,
          error: {
            code: "NO_DRIVER_ASSIGNED",
            message: "No driver assigned yet.",
          },
        });
      }

      const driver = await User.findById(group.driver._id);
      res.json({
        success: true,
        data: {
          driver: {
            id: driver._id,
            full_name: driver.fullName,
            phone: driver.phone,
            vehicle_type: group.vehicle_type,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: "FETCH_FAILED", message: "Failed to fetch driver" },
      });
    }
  }

  // GET /api/groups/:id/availability
  static async checkAvailability(req, res) {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: "GROUP_NOT_FOUND", message: "Group not found" },
        });
      }

      res.json({
        success: true,
        data: {
          group_id: group._id,
          group_name: group.name,
          vehicle_type: group.vehicle_type,
          capacity: group.capacity,
          max_capacity: VEHICLE_CAPACITIES[group.vehicle_type],
          current_members: group.current_members,
          spots_left: group.spots_left,
          is_available: group.is_available,
          status: group.status,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "CHECK_FAILED",
          message: "Failed to check availability",
        },
      });
    }
  }

  // GET /api/groups/:id/price-estimate
  static async getPriceEstimate(req, res) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "lat and lng are required",
          },
        });
      }

      const group = await Group.findById(req.params.id);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: "GROUP_NOT_FOUND", message: "Group not found" },
        });
      }

      const pricing = group.calculatePrice({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });
      res.json({ success: true, data: { group_id: group._id, pricing } });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: "CALCULATION_FAILED",
          message: "Failed to calculate price",
        },
      });
    }
  }

  // POST /api/groups
  // POST /api/groups
  static async create(req, res) {
    try {
      const {
        name,
        school,
        vehicle_type,
        capacity,
        base_price,
        description,
        start_date,
        pickup_address,
        pickup_latitude,
        pickup_longitude,
        pickup_radius,
        child_id,
      } = req.body;

      if (!name || !school || !vehicle_type || !base_price) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "name, school, vehicle_type, base_price are required",
          },
        });
      }

      if (!pickup_latitude || !pickup_longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "pickup_latitude and pickup_longitude are required",
          },
        });
      }

      if (!VEHICLE_CAPACITIES[vehicle_type]) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_VEHICLE_TYPE",
            message: `vehicle_type must be one of: ${Object.keys(VEHICLE_CAPACITIES).join(", ")}`,
          },
        });
      }

      const maxCapacity = VEHICLE_CAPACITIES[vehicle_type];
      const finalCapacity = capacity
        ? Math.min(parseInt(capacity), maxCapacity)
        : maxCapacity;

      const schoolExists = await School.findById(school);
      if (!schoolExists) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_SCHOOL", message: "School not found" },
        });
      }

      // Auto-add creator's child as first member
      let initialMembers = [];
      if (child_id) {
        // Use specific child if passed
        const child = await Child.findOne({
          _id: child_id,
          parent: req.user._id,
        });
        if (child) {
          initialMembers = [
            {
              child: child._id,
              parent: req.user._id,
              joined_at: new Date(),
              status: "active",
            },
          ];
        }
      } else {
        // Auto-find creator's first active child
        const creatorChild = await Child.findOne({
          parent: req.user._id,
          isActive: true,
        });
        if (creatorChild) {
          initialMembers = [
            {
              child: creatorChild._id,
              parent: req.user._id,
              joined_at: new Date(),
              status: "active",
            },
          ];
        }
      }

      const group = new Group({
        name,
        school,
        vehicle_type,
        capacity: finalCapacity,
        base_price: parseFloat(base_price),
        pickup_location: {
          type: "Point",
          coordinates: [
            parseFloat(pickup_longitude),
            parseFloat(pickup_latitude),
          ],
        },
        pickup_address: pickup_address || "",
        pickup_radius: pickup_radius ? parseInt(pickup_radius) : 500,
        description: description || "",
        start_date: start_date ? new Date(start_date) : new Date(),
        members: initialMembers,
        status: "open",
        createdBy: req.user._id,
      });

      await group.save();
      await group.populate("school", "name address");
      await group.populate("members.child", "name grade");
      await group.populate("members.parent", "fullName phone");

      res.status(201).json({
        success: true,
        message: "Group created successfully",
        data: {
          group: {
            id: group._id,
            name: group.name,
            school: group.school,
            vehicle_type: group.vehicle_type,
            capacity: group.capacity,
            max_capacity: maxCapacity,
            current_members: group.current_members,
            spots_left: group.spots_left,
            base_price: group.base_price,
            pickup_address: group.pickup_address,
            pickup_location: group.pickup_location,
            pickup_radius: group.pickup_radius,
            status: group.status,
            members: group.members
              .filter((m) => m.status === "active")
              .map((m) => ({
                child: m.child,
                parent: m.parent,
                joined_at: m.joined_at,
              })),
          },
        },
      });
    } catch (error) {
      console.error("Create group error:", error);
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: errors.join(", ") },
        });
      }
      res.status(500).json({
        success: false,
        error: { code: "CREATE_FAILED", message: "Failed to create group" },
      });
    }
  }

  // PUT /api/groups/:id
  static async update(req, res) {
    try {
      const updateData = { ...req.body, updatedBy: req.user?._id };

      if (updateData.vehicle_type) {
        const max = VEHICLE_CAPACITIES[updateData.vehicle_type];
        if (!max) {
          return res.status(400).json({
            success: false,
            error: {
              code: "INVALID_VEHICLE_TYPE",
              message: "Invalid vehicle type",
            },
          });
        }
        updateData.capacity = updateData.capacity
          ? Math.min(parseInt(updateData.capacity), max)
          : max;
      }

      if (updateData.pickup_latitude && updateData.pickup_longitude) {
        updateData.pickup_location = {
          type: "Point",
          coordinates: [
            parseFloat(updateData.pickup_longitude),
            parseFloat(updateData.pickup_latitude),
          ],
        };
        delete updateData.pickup_latitude;
        delete updateData.pickup_longitude;
      }

      const group = await Group.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).populate("school", "name address");

      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Group not found" },
        });
      }

      res.json({
        success: true,
        message: "Group updated successfully",
        data: { group },
      });
    } catch (error) {
      console.error("Update group error:", error);
      res.status(500).json({
        success: false,
        error: { code: "UPDATE_FAILED", message: "Failed to update group" },
      });
    }
  }

  // DELETE /api/groups/:id
  static async delete(req, res) {
    try {
      const group = await Group.findByIdAndDelete(req.params.id);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Group not found" },
        });
      }
      res.json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
      console.error("Delete group error:", error);
      res.status(500).json({
        success: false,
        error: { code: "DELETE_FAILED", message: "Failed to delete group" },
      });
    }
  }
}

module.exports = GroupsController;
