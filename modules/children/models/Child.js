const mongoose = require("mongoose");

const childSchema = new mongoose.Schema(
  {
    // Parent reference
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Parent reference is required"],
    },

    // Basic child information
    name: {
      type: String,
      required: [true, "Child name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    grade: {
      type: String,
      required: [true, "Grade is required"],
      trim: true,
      maxlength: [20, "Grade cannot exceed 20 characters"],
    },

    // Pickup address
    pickupAddress: {
      address: {
        type: String,
        required: [true, "Pickup address is required"],
        trim: true,
        maxlength: [500, "Address cannot exceed 500 characters"],
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
      landmark: {
        type: String,
        trim: true,
        maxlength: [200, "Landmark cannot exceed 200 characters"],
      },
    },

    // Vehicle type preference
    vehicleType: {
      type: String,
      enum: ["bajaj", "minibus", "bus", "any"],
      default: "any",
    },

    // School (destination)
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      default: null,
    },

    // School name as fallback if no ObjectId
    schoolName: {
      type: String,
      trim: true,
      maxlength: [200, "School name cannot exceed 200 characters"],
    },

    // Schedules (optional, can be added later)
    schedules: [
      {
        type: {
          type: String,
          enum: ["pickup", "dropoff"],
          required: true,
        },
        session: {
          type: String,
          enum: ["morning", "afternoon"],
        },
        time: {
          type: String,
          validate: {
            validator: function (time) {
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
            },
            message: "Time must be in HH:mm format (24-hour)",
          },
        },
        day: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [200, "Notes cannot exceed 200 characters"],
        },
      },
    ],

    // Child status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Subscription information
    subscription: {
      status: {
        type: String,
        enum: ["active", "inactive", "suspended", "pending"],
        default: "inactive",
      },
      plan: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "daily",
      },
      startDate: {
        type: Date,
        default: null,
      },
      endDate: {
        type: Date,
        default: null,
      },
      driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null,
      },
    },

    // Audit fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
childSchema.index({ parent: 1, isActive: 1 });
childSchema.index({ "pickupAddress.coordinates": "2dsphere" });
childSchema.index({ "subscription.status": 1 });

// Virtual for formatted schedules
childSchema.virtual("formattedSchedules").get(function () {
  const scheduleMap = {};
  this.schedules.forEach((schedule) => {
    if (!scheduleMap[schedule.day]) {
      scheduleMap[schedule.day] = { pickup: [], dropoff: [] };
    }
    scheduleMap[schedule.day][schedule.type].push({
      time: schedule.time,
      isActive: schedule.isActive,
      notes: schedule.notes,
    });
  });
  return scheduleMap;
});

// Pre-save middleware
childSchema.pre("save", function (next) {
  if (this.schedules && this.schedules.length > 0) {
    const scheduleErrors = [];
    this.schedules.forEach((schedule, index) => {
      const duplicates = this.schedules.filter(
        (s, i) =>
          i !== index &&
          s.day === schedule.day &&
          s.type === schedule.type &&
          s.time === schedule.time,
      );
      if (duplicates.length > 0) {
        scheduleErrors.push(
          `Duplicate ${schedule.type} schedule for ${schedule.day} at ${schedule.time}`,
        );
      }
    });
    if (scheduleErrors.length > 0) {
      return next(new Error(scheduleErrors.join(", ")));
    }
  }
  next();
});

// Static methods
childSchema.statics.findByParent = function (parentId, isActive = true) {
  return this.find({ parent: parentId, isActive }).sort({ createdAt: -1 });
};

childSchema.statics.findWithDetails = function (childId) {
  return this.findById(childId)
    .populate("parent", "firstName lastName phone")
    .populate("school", "name address")
    .populate("subscription.driver", "firstName lastName phone");
};

// Instance methods
childSchema.methods.addSchedule = function (scheduleData) {
  this.schedules.push(scheduleData);
  return this.save();
};

childSchema.methods.getActiveSchedules = function (day = null) {
  let schedules = this.schedules.filter((s) => s.isActive);
  if (day) schedules = schedules.filter((s) => s.day === day);
  return schedules.sort((a, b) => a.time.localeCompare(b.time));
};

childSchema.methods.getTodaysSchedules = function () {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = days[new Date().getDay()];
  return this.getActiveSchedules(today);
};

const Child = mongoose.model("Child", childSchema);
module.exports = Child;
