const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [100, 'School name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'School type is required'],
    enum: ['Primary', 'Secondary', 'High School', 'Kindergarten', 'International', 'Private', 'Public', 'Other']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(phone) {
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return !email || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180
      }
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    subCity: {
      type: String,
      trim: true
    },
    woreda: {
      type: String,
      trim: true
    }
  },
  photo: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  establishedYear: {
    type: Number,
    min: [1800, 'Established year must be after 1800'],
    max: [new Date().getFullYear(), 'Established year cannot be in the future']
  },
  website: {
    type: String,
    validate: {
      validator: function(website) {
        return !website || /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(website);
      },
      message: 'Please enter a valid website URL'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
schoolSchema.index({ name: 1 });
schoolSchema.index({ type: 1 });
schoolSchema.index({ 'location.city': 1 });
schoolSchema.index({ isActive: 1 });
schoolSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for full address
schoolSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.location.address,
    this.location.subCity,
    this.location.woreda,
    this.location.city
  ].filter(part => part && part.trim());
  
  return parts.join(', ');
});

// Virtual for display name
schoolSchema.virtual('displayName').get(function() {
  return `${this.name} - ${this.type}`;
});

// Static methods
schoolSchema.statics = {
  // Find schools by location (nearby)
  async findNearby(lat, lng, maxDistance = 10000) {
    return this.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      },
      isActive: true
    });
  },

  // Get schools by city
  async findByCity(city) {
    return this.find({
      'location.city': city,
      isActive: true
    }).sort({ name: 1 });
  },

  // Get school statistics
  async getStats() {
    const stats = await this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalSchools: { $sum: 1 },
          totalStudents: { $sum: '$totalStudents' },
          typeDistribution: {
            $push: {
              type: '$type',
              count: 1
            }
          },
          cityDistribution: {
            $push: {
              city: '$location.city',
              count: 1
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalSchools: 0,
      totalStudents: 0,
      typeDistribution: [],
      cityDistribution: []
    };

    // Group by type
    const typeStats = {};
    result.typeDistribution.forEach(item => {
      typeStats[item.type] = (typeStats[item.type] || 0) + 1;
    });

    // Group by city
    const cityStats = {};
    result.cityDistribution.forEach(item => {
      cityStats[item.city] = (cityStats[item.city] || 0) + 1;
    });

    return {
      totalSchools: result.totalSchools,
      totalStudents: result.totalStudents,
      typeDistribution: Object.entries(typeStats).map(([type, count]) => ({ _id: type, count })),
      cityDistribution: Object.entries(cityStats).map(([city, count]) => ({ _id: city, count }))
    };
  },

  // Search schools
  async searchSchools(query, filters = {}) {
    const searchCriteria = {
      isActive: true,
      ...filters
    };

    if (query) {
      searchCriteria.$or = [
        { name: { $regex: query, $options: 'i' } },
        { type: { $regex: query, $options: 'i' } },
        { 'location.city': { $regex: query, $options: 'i' } },
        { 'location.address': { $regex: query, $options: 'i' } }
      ];
    }

    return this.find(searchCriteria)
      .sort({ name: 1 })
      .populate('totalStudents');
  }
};

// Instance methods
schoolSchema.methods = {
  // Get public profile
  getPublicProfile() {
    return {
      _id: this._id,
      name: this.name,
      type: this.type,
      phone: this.phone,
      email: this.email,
      location: this.location,
      photo: this.photo,
      description: this.description,
      totalStudents: this.totalStudents,
      establishedYear: this.establishedYear,
      website: this.website,
      fullAddress: this.fullAddress,
      displayName: this.displayName
    };
  },

  // Update student count
  async updateStudentCount(count) {
    this.totalStudents = Math.max(0, count);
    return this.save();
  },

  // Toggle active status
  async toggleStatus() {
    this.isActive = !this.isActive;
    return this.save();
  }
};

// Pre-save middleware
schoolSchema.pre('save', function(next) {
  // Ensure coordinates are numbers
  if (this.location.coordinates) {
    this.location.coordinates.lat = parseFloat(this.location.coordinates.lat);
    this.location.coordinates.lng = parseFloat(this.location.coordinates.lng);
  }
  
  next();
});

const School = mongoose.model('School', schoolSchema);

module.exports = School;
