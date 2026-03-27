const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    address: {
      street: String,
      city: String,
      region: String,
      country: {
        type: String,
        default: "Ethiopia",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
schoolSchema.index({ name: "text" });
schoolSchema.index({ "address.city": 1 });
schoolSchema.index({ location: "2dsphere" });

// Sync location on save
schoolSchema.pre("save", function (next) {
  if (this.latitude && this.longitude) {
    this.location = {
      type: "Point",
      coordinates: [this.longitude, this.latitude],
    };
  }
  next();
});

// Find nearby schools
schoolSchema.statics.findNearby = async function (
  longitude,
  latitude,
  maxDistance = 10000,
) {
  return await this.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
  });
};

const School = mongoose.model("School", schoolSchema);
module.exports = School;
