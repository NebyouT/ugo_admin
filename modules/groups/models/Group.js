const mongoose = require("mongoose");

const VEHICLE_CAPACITIES = {
  bajaj: 3,
  force: 5,
  electric: 4,
};

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },

    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: [true, "School is required"],
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    vehicle_type: {
      type: String,
      enum: ["bajaj", "force", "electric"],
      required: [true, "Vehicle type is required"],
    },

    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
      validate: {
        validator: function (value) {
          return value <= VEHICLE_CAPACITIES[this.vehicle_type];
        },
        message: "Capacity cannot exceed vehicle type maximum",
      },
    },

    // ── Members list ─────────────────────────────────────────
    members: [
      {
        child: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Child",
          required: true,
        },
        parent: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joined_at: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["active", "suspended", "left"],
          default: "active",
        },
      },
    ],

    base_price: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Base price cannot be negative"],
    },

    // Pickup area center point
    pickup_location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Pickup location is required"],
      },
    },

    pickup_address: {
      type: String,
      trim: true,
    },

    // Radius in meters parents must be within to join
    pickup_radius: {
      type: Number,
      default: 500,
      min: 100,
      max: 5000,
    },

    status: {
      type: String,
      enum: ["open", "full", "inactive", "cancelled"],
      default: "open",
    },

    voting: {
      status: {
        type: String,
        enum: ["inactive", "active", "completed"],
        default: "inactive",
      },
      deadline: Date,
      candidates: [
        {
          driver_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          votes: { type: Number, default: 0 },
        },
      ],
    },

    start_date: { type: Date, default: Date.now },
    description: { type: String, trim: true, maxlength: 500 },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ──────────────────────────────────────────────
groupSchema.index({ school: 1, status: 1 });
groupSchema.index({ driver: 1 });
groupSchema.index({ vehicle_type: 1 });
groupSchema.index({ isDeleted: 1, isActive: 1 });
groupSchema.index({ pickup_location: "2dsphere" });
groupSchema.index({ "members.child": 1 });
groupSchema.index({ "members.parent": 1 });

// ── Virtuals ─────────────────────────────────────────────
groupSchema.virtual("spots_left").get(function () {
  const activeMembers = this.members.filter(
    (m) => m.status === "active",
  ).length;
  return Math.max(0, this.capacity - activeMembers);
});

groupSchema.virtual("current_members").get(function () {
  return this.members.filter((m) => m.status === "active").length;
});

groupSchema.virtual("is_available").get(function () {
  return this.status === "open" && this.spots_left > 0;
});

groupSchema.virtual("max_capacity").get(function () {
  return VEHICLE_CAPACITIES[this.vehicle_type] || 0;
});

// ── Static: search by school + nearby pickup ─────────────
groupSchema.statics.searchNearby = async function ({
  school_id,
  longitude,
  latitude,
  radius_meters = 500,
  vehicle_type,
}) {
  const query = {
    isDeleted: false,
    isActive: true,
    status: "open",
    school: school_id,
    pickup_location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: radius_meters,
      },
    },
  };

  if (vehicle_type) query.vehicle_type = vehicle_type;

  return this.find(query)
    .populate("driver", "fullName phone")
    .populate("school", "name address")
    .populate("members.child", "name grade")
    .populate("members.parent", "fullName phone")
    .sort({ "members.length": -1 });
};

groupSchema.statics.VEHICLE_CAPACITIES = VEHICLE_CAPACITIES;

// ── Instance methods ──────────────────────────────────────

// Add a child+parent to group
groupSchema.methods.addMember = function (childId, parentId) {
  // Check if child already in group
  const alreadyMember = this.members.some(
    (m) => m.child.toString() === childId.toString() && m.status === "active",
  );
  if (alreadyMember) throw new Error("Child is already a member of this group");

  // Check capacity
  const activeCount = this.members.filter((m) => m.status === "active").length;
  if (activeCount >= this.capacity) throw new Error("Group is full");

  this.members.push({
    child: childId,
    parent: parentId,
    joined_at: new Date(),
    status: "active",
  });

  // Update status if now full
  if (
    this.members.filter((m) => m.status === "active").length >= this.capacity
  ) {
    this.status = "full";
  }

  return this.save();
};

// Remove a child from group
groupSchema.methods.removeMember = function (childId) {
  const member = this.members.find(
    (m) => m.child.toString() === childId.toString() && m.status === "active",
  );
  if (!member) throw new Error("Child is not an active member of this group");

  member.status = "left";

  // Reopen if was full
  if (this.status === "full") this.status = "open";

  return this.save();
};

groupSchema.methods.calculatePrice = function (pickupLocation) {
  let totalPrice = this.base_price;
  if (pickupLocation) {
    const distanceKm = 3.5;
    totalPrice += distanceKm * 85;
  }
  return {
    base_price: this.base_price,
    distance_km: 3.5,
    distance_fee: totalPrice - this.base_price,
    total_price: totalPrice,
    currency: "ETB",
    billing: "monthly",
  };
};

// ── Pre-save ──────────────────────────────────────────────
groupSchema.pre("save", function (next) {
  // Cap capacity to vehicle max
  const max = VEHICLE_CAPACITIES[this.vehicle_type];
  if (max && this.capacity > max) this.capacity = max;

  // Sync status based on active members
  const activeCount = this.members.filter((m) => m.status === "active").length;
  if (activeCount >= this.capacity && this.status === "open") {
    this.status = "full";
  } else if (activeCount < this.capacity && this.status === "full") {
    this.status = "open";
  }

  next();
});

module.exports = mongoose.model("Group", groupSchema);
