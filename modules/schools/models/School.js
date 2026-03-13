const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Location data
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  
  // Separate lat/lng for easier access
  latitude: {
    type: Number,
    required: true
  },
  
  longitude: {
    type: Number,
    required: true
  },
  
  // Address information
  address: {
    street: String,
    city: String,
    region: String,
    country: {
      type: String,
      default: 'Ethiopia'
    },
    postalCode: String,
    formattedAddress: String
  },
  
  // Contact information
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  
  // School details
  type: {
    type: String,
    enum: ['kindergarten', 'primary', 'secondary', 'high_school', 'university', 'other'],
    default: 'primary'
  },
  
  grades: {
    from: String,
    to: String
  },
  
  studentCapacity: {
    type: Number,
    default: 0
  },
  
  currentStudents: {
    type: Number,
    default: 0
  },
  
  // Operating hours
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  
  // Service area (for pickup/dropoff zones)
  serviceRadius: {
    type: Number, // in kilometers
    default: 5
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_verification'],
    default: 'active'
  },
  
  // Additional information
  description: String,
  
  facilities: [String], // e.g., ['library', 'playground', 'cafeteria']
  
  logo: String, // URL to school logo
  
  photos: [String], // URLs to school photos
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  verifiedAt: Date,
  
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
schoolSchema.index({ name: 'text' });
schoolSchema.index({ 'address.city': 1 });
schoolSchema.index({ type: 1, isActive: 1 });
schoolSchema.index({ location: '2dsphere' });

// Virtual for total students count
schoolSchema.virtual('enrollmentPercentage').get(function() {
  if (this.studentCapacity === 0) return 0;
  return Math.round((this.currentStudents / this.studentCapacity) * 100);
});

// Static methods
schoolSchema.statics.findNearby = async function(longitude, latitude, maxDistance = 10000) {
  return await this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    isActive: true
  });
};

schoolSchema.statics.searchByName = async function(searchTerm) {
  return await this.find({
    $text: { $search: searchTerm },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

schoolSchema.statics.getByCity = async function(city) {
  return await this.find({
    'address.city': new RegExp(city, 'i'),
    isActive: true
  }).sort({ name: 1 });
};

// Pre-save middleware to sync location coordinates
schoolSchema.pre('save', function(next) {
  if (this.latitude && this.longitude) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  next();
});

// Instance methods
schoolSchema.methods.updateStudentCount = async function(count) {
  this.currentStudents = count;
  return await this.save();
};

const School = mongoose.model('School', schoolSchema);

module.exports = School;
