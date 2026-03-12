const mongoose = require('mongoose');

const driverDetailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Online Status and Availability
  isOnline: {
    type: Boolean,
    default: false
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'unavailable', 'busy', 'off_duty'],
    default: 'unavailable'
  },
  
  // Time Tracking
  onlineTime: {
    type: Number,
    default: 0 // Total online time in minutes
  },
  onDrivingTime: {
    type: Number,
    default: 0 // Total driving time in minutes
  },
  idleTime: {
    type: Number,
    default: 0 // Total idle time in minutes
  },
  
  // Daily Schedule
  online: {
    type: String, // Time in HH:mm format
    default: null
  },
  offline: {
    type: String, // Time in HH:mm format
    default: null
  },
  accepted: {
    type: String, // Time when last trip was accepted
    default: null
  },
  completed: {
    type: String, // Time when last trip was completed
    default: null
  },
  startDriving: {
    type: String, // Time when started driving for current trip
    default: null
  },
  
  // Service Information
  services: [{
    type: String,
    enum: ['ride', 'parcel', 'both'],
    default: 'ride'
  }],
  
  // Trip Statistics
  rideCount: {
    type: Number,
    default: 0
  },
  parcelCount: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  
  // Performance Metrics
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Vehicle Information
  currentVehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  
  // Location Tracking
  currentLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // Service Area
  serviceArea: {
    type: String,
    default: null
  },
  
  // Verification Status
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: String // URLs to uploaded documents
  }],
  
  // Driver Notes
  adminNote: {
    type: String,
    default: null
  },
  driverNote: {
    type: String,
    default: null
  },
  
  // Bank Information
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    routingNumber: String
  },
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual Fields
driverDetailSchema.virtual('totalTrips').get(function() {
  return this.rideCount + this.parcelCount;
});

driverDetailSchema.virtual('isAvailable').get(function() {
  return this.isOnline && this.availabilityStatus === 'available';
});

driverDetailSchema.virtual('earningsPerTrip').get(function() {
  return this.totalTrips > 0 ? this.totalEarnings / this.totalTrips : 0;
});

// Indexes
driverDetailSchema.index({ user: 1 });
driverDetailSchema.index({ isOnline: 1 });
driverDetailSchema.index({ availabilityStatus: 1 });
driverDetailSchema.index({ verificationStatus: 1 });
driverDetailSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

// Instance Methods
driverDetailSchema.methods.goOnline = function() {
  this.isOnline = true;
  this.availabilityStatus = 'available';
  this.online = new Date().toTimeString().slice(0, 5);
  return this.save();
};

driverDetailSchema.methods.goOffline = function() {
  this.isOnline = false;
  this.availabilityStatus = 'unavailable';
  this.offline = new Date().toTimeString().slice(0, 5);
  return this.save();
};

driverDetailSchema.methods.updateLocation = function(latitude, longitude) {
  this.currentLocation = {
    latitude,
    longitude,
    lastUpdated: new Date()
  };
  return this.save();
};

driverDetailSchema.methods.incrementTripCount = function(tripType = 'ride') {
  if (tripType === 'ride') {
    this.rideCount += 1;
  } else if (tripType === 'parcel') {
    this.parcelCount += 1;
  }
  return this.save();
};

driverDetailSchema.methods.updateRating = function(newRating) {
  const totalRatingsBefore = this.totalRatings;
  this.totalRatings += 1;
  
  // Calculate new average rating
  const totalRatingPoints = this.averageRating * totalRatingsBefore + newRating;
  this.averageRating = totalRatingPoints / this.totalRatings;
  
  return this.save();
};

// Static Methods
driverDetailSchema.statics.findOnlineDrivers = function(serviceArea = null) {
  const query = {
    isOnline: true,
    availabilityStatus: 'available',
    verificationStatus: 'verified'
  };
  
  if (serviceArea) {
    query.serviceArea = serviceArea;
  }
  
  return this.find(query).populate('user', 'firstName lastName email phone profileImage');
};

driverDetailSchema.statics.getDriverStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalDrivers: { $sum: 1 },
        onlineDrivers: { $sum: { $cond: ['$isOnline', 1, 0] } },
        availableDrivers: { $sum: { $cond: [{ $eq: ['$availabilityStatus', 'available'] }, 1, 0] } },
        verifiedDrivers: { $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] } },
        averageRating: { $avg: '$averageRating' },
        totalTrips: { $sum: { $add: ['$rideCount', '$parcelCount'] } },
        totalEarnings: { $sum: '$totalEarnings' }
      }
    }
  ]);
};

driverDetailSchema.statics.getTopPerformers = function(limit = 10) {
  return this.find({ verificationStatus: 'verified' })
    .sort({ averageRating: -1, totalEarnings: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email phone profileImage');
};

module.exports = mongoose.model('DriverDetail', driverDetailSchema);
