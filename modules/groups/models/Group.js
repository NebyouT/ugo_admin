const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  // Basic group information
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  
  // School association
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School is required']
  },
  
  // Driver assignment
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Schedule information
  schedule: {
    pickup_time: {
      type: String,
      required: [true, 'Pickup time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    drop_time: {
      type: String,
      required: [true, 'Drop time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }]
  },
  
  // Capacity and members
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [15, 'Capacity cannot exceed 15']
  },
  current_members: {
    type: Number,
    default: 0,
    min: [0, 'Current members cannot be negative']
  },
  
  // Pricing
  base_price: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  
  // Status and lifecycle
  status: {
    type: String,
    enum: ['open', 'full', 'inactive', 'cancelled'],
    default: 'open'
  },
  
  // Voting system for driver selection
  voting: {
    status: {
      type: String,
      enum: ['inactive', 'active', 'completed'],
      default: 'inactive'
    },
    deadline: Date,
    candidates: [{
      driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      votes: {
        type: Number,
        default: 0
      }
    }]
  },
  
  // Route information for pickup locations
  route: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Start date for the group
  start_date: {
    type: Date,
    default: Date.now
  },
  
  // Standard fields
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
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
  deletedAt: Date
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
groupSchema.index({ school: 1, status: 1 });
groupSchema.index({ driver: 1 });
groupSchema.index({ 'voting.status': 1 });
groupSchema.index({ isDeleted: 1, isActive: 1 });
groupSchema.index({ createdAt: -1 });

// Virtual fields
groupSchema.virtual('spots_left').get(function() {
  return Math.max(0, this.capacity - this.current_members);
});

groupSchema.virtual('is_available').get(function() {
  return this.status === 'open' && this.spots_left > 0;
});

// Static methods
groupSchema.statics.findActive = function() {
  return this.find({ isDeleted: false, isActive: true });
};

groupSchema.statics.findBySchool = function(schoolId, options = {}) {
  const query = { 
    school: schoolId, 
    isDeleted: false, 
    isActive: true 
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query).populate('driver', 'name email phone rating');
};

groupSchema.statics.searchGroups = function(filters) {
  const query = { 
    isDeleted: false, 
    isActive: true,
    status: 'open'
  };
  
  if (filters.school_id) {
    query.school = filters.school_id;
  }
  
  if (filters.pickup_location) {
    // For now, return groups for the school
    // In production, this would use geospatial queries
  }
  
  if (filters.preferred_time) {
    // Find groups with pickup time within 30 minutes
    const [hour, minute] = filters.preferred_time.split(':').map(Number);
    const timeInMinutes = hour * 60 + minute;
    
    query['$or'] = [
      { 'schedule.pickup_time': filters.preferred_time },
      // Add logic for nearby times
    ];
  }
  
  return this.find(query)
    .populate('driver', 'name email phone rating photo')
    .populate('school', 'name address')
    .sort({ createdAt: -1 });
};

// Instance methods
groupSchema.methods.addMember = function() {
  if (this.current_members < this.capacity) {
    this.current_members += 1;
    if (this.current_members >= this.capacity) {
      this.status = 'full';
    }
    return this.save();
  }
  throw new Error('Group is full');
};

groupSchema.methods.removeMember = function() {
  if (this.current_members > 0) {
    this.current_members -= 1;
    if (this.status === 'full') {
      this.status = 'open';
    }
    return this.save();
  }
  throw new Error('No members to remove');
};

groupSchema.methods.calculatePrice = function(pickupLocation) {
  // Base price
  let totalPrice = this.base_price;
  
  // Distance calculation (simplified)
  if (pickupLocation && this.route && this.route.points) {
    // In production, this would calculate actual distance
    const distanceKm = 3.5; // Placeholder
    const distanceFee = distanceKm * 85; // 85 ETB per km
    totalPrice += distanceFee;
  }
  
  return {
    base_price: this.base_price,
    distance_km: 3.5,
    distance_fee: totalPrice - this.base_price,
    total_price: totalPrice,
    currency: 'ETB',
    billing: 'monthly'
  };
};

// Pre-save hooks
groupSchema.pre('save', function(next) {
  // Ensure current_members doesn't exceed capacity
  if (this.current_members > this.capacity) {
    this.current_members = this.capacity;
  }
  
  // Update status based on capacity
  if (this.current_members >= this.capacity && this.status === 'open') {
    this.status = 'full';
  } else if (this.current_members < this.capacity && this.status === 'full') {
    this.status = 'open';
  }
  
  next();
});

// Post-save hooks
groupSchema.post('save', function(doc) {
  console.log(`Group ${doc.name} saved with ${doc.current_members}/${doc.capacity} members`);
});

module.exports = mongoose.model('Group', groupSchema);
