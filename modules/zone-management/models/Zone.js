const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  // Basic zone information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  readable_id: {
    type: Number,
    unique: true,
    sparse: true
  },
  
  // Geospatial data - Polygon for zone boundaries
  coordinates: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of [longitude, latitude] pairs
      required: true,
      index: '2dsphere'
    }
  },
  
  // Zone properties
  description: {
    type: String,
    trim: true
  },
  
  // Service area properties
  service_radius: {
    type: Number,
    default: 5, // in kilometers
    min: 0.1,
    max: 50
  },
  
  // Fare management
  extra_fare_status: {
    type: Boolean,
    default: false
  },
  
  extra_fare_fee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  extra_fare_reason: {
    type: String,
    trim: true
  },
  
  // Status
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Metadata
  color: {
    type: String,
    default: '#667eea',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  deletedAt: {
    type: Date
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  collection: 'zones'
});

// Indexes
zoneSchema.index({ name: 'text' });
zoneSchema.index({ is_active: 1, isDeleted: 1 });
zoneSchema.index({ coordinates: '2dsphere' });
zoneSchema.index({ readable_id: 1 }, { unique: true, sparse: true });

// Virtual fields
zoneSchema.virtual('is_active_status').get(function() {
  return this.is_active ? 'Active' : 'Inactive';
});

zoneSchema.virtual('total_area').get(function() {
  if (!this.coordinates || !this.coordinates.coordinates || this.coordinates.coordinates.length === 0) {
    return 0;
  }
  
  // Calculate polygon area (simplified approximation)
  const coords = this.coordinates.coordinates[0];
  let area = 0;
  
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    area += (x1 * y2 - x2 * y1);
  }
  
  return Math.abs(area / 2); // Convert to square degrees, then to km² (rough approximation)
});

// Static methods
zoneSchema.statics.findActive = function() {
  return this.find({ is_active: true, isDeleted: false }).sort({ name: 1 });
};

zoneSchema.statics.findByName = function(name) {
  return this.findOne({ 
    name: new RegExp(name, 'i'), 
    is_active: true, 
    isDeleted: false 
  });
};

zoneSchema.statics.findByCoordinates = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    is_active: true,
    isDeleted: false
  });
};

zoneSchema.statics.getStats = async function() {
  const total = await this.countDocuments({ isDeleted: false });
  const active = await this.countDocuments({ is_active: true, isDeleted: false });
  const inactive = await this.countDocuments({ is_active: false, isDeleted: false });
  const deleted = await this.countDocuments({ isDeleted: true });
  
  return {
    total,
    active,
    inactive,
    deleted
  };
};

// Instance methods
zoneSchema.methods.containsPoint = function(longitude, latitude) {
  if (!this.coordinates || !this.coordinates.coordinates) {
    return false;
  }
  
  // Check if point is within polygon using ray casting algorithm
  const point = [longitude, latitude];
  const coords = this.coordinates.coordinates[0];
  let inside = false;
  
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [xi, yi] = coords[i];
    const [xj, yj] = coords[j];
    
    const intersect = ((yi > yj) !== (yi > latitude)) 
      ? ((xi > longitude) !== (xi > longitude))
      : ((xi > longitude) !== (xi > longitude)) ^ ((yi > latitude) !== (yi > latitude));
      
    if (intersect) {
      inside = !inside;
    }
  }
  
  return inside;
};

zoneSchema.methods.activate = function() {
  this.is_active = true;
  return this.save();
};

zoneSchema.methods.deactivate = function() {
  this.is_active = false;
  return this.save();
};

zoneSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.is_active = false;
  return this.save();
};

// Pre-save middleware to generate readable_id
zoneSchema.pre('save', async function(next) {
  if (this.isNew && !this.readable_id) {
    try {
      const maxReadableId = await this.constructor.findOne().sort('-readable_id').limit(1);
      this.readable_id = maxReadableId ? maxReadableId.readable_id + 1 : 1;
    } catch (error) {
      this.readable_id = 1;
    }
  }
  next();
});

// Post-save middleware to update readable_id if needed
zoneSchema.post('save', async function(doc, next) {
  if (doc.isNew && !doc.readable_id) {
    try {
      const maxReadableId = await doc.constructor.findOne().sort('-readable_id').limit(1);
      doc.readable_id = maxReadableId ? maxReadableId.readable_id + 1 : 1;
      await doc.save();
    } catch (error) {
      // Handle error silently
    }
  }
  next();
});

const Zone = mongoose.model('Zone', zoneSchema);

module.exports = Zone;
