const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  // Parent reference - only parents can create children
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent reference is required']
  },
  
  // Basic child information
  name: {
    type: String,
    required: [true, 'Child name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    trim: true,
    maxlength: [20, 'Grade cannot exceed 20 characters']
  },
  
  // Pickup address with geolocation
  pickupAddress: {
    address: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function(coords) {
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && // longitude
                   coords[1] >= -90 && coords[1] <= 90;     // latitude
          },
          message: 'Invalid coordinates. Must be [longitude, latitude]'
        }
      }
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [200, 'Landmark cannot exceed 200 characters']
    }
  },
  
  // Flexible pickup and dropoff schedule with sessions
  schedules: [{
    type: {
      type: String,
      enum: ['pickup', 'dropoff'],
      required: true
    },
    session: {
      type: String,
      enum: ['morning', 'afternoon'],
      required: [true, 'Session is required']
    },
    time: {
      type: String, // Format: "HH:mm" in 24-hour format
      required: [true, 'Time is required'],
      validate: {
        validator: function(time) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Time must be in HH:mm format (24-hour)'
      }
    },
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: [true, 'Day is required']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  
    
  // School information
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School reference is required']
  },
  
  // Additional school details for reference
  schoolDetails: {
    name: {
      type: String,
      trim: true,
      maxlength: [200, 'School name cannot exceed 200 characters']
    },
    grade: {
      type: String,
      trim: true,
      maxlength: [20, 'Grade cannot exceed 20 characters']
    }
  },
  
  // Child status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Subscription information (for transportation service)
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'pending'],
      default: 'inactive'
    },
    plan: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    }
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
childSchema.index({ parent: 1, isActive: 1 });
childSchema.index({ 'pickupAddress.coordinates': '2dsphere' });
childSchema.index({ 'schedules.day': 1, 'schedules.isActive': 1 });
childSchema.index({ 'subscription.status': 1 });

// Virtual for formatted schedules
childSchema.virtual('formattedSchedules').get(function() {
  const scheduleMap = {};
  
  this.schedules.forEach(schedule => {
    if (!scheduleMap[schedule.day]) {
      scheduleMap[schedule.day] = {
        pickup: [],
        dropoff: []
      };
    }
    
    scheduleMap[schedule.day][schedule.type].push({
      time: schedule.time,
      isActive: schedule.isActive,
      notes: schedule.notes
    });
  });
  
  return scheduleMap;
});

// Virtual for age calculation (if DOB is added later)
childSchema.virtual('age').get(function() {
  // This can be implemented when dateOfBirth is added
  return null;
});

// Pre-save middleware to validate schedule combinations
childSchema.pre('save', function(next) {
  // Validate that schedules make sense (pickup before dropoff, etc.)
  const scheduleErrors = [];
  
  this.schedules.forEach((schedule, index) => {
    // Check for duplicate schedules on same day and time
    const duplicates = this.schedules.filter((s, i) => 
      i !== index && 
      s.day === schedule.day && 
      s.type === schedule.type && 
      s.time === schedule.time
    );
    
    if (duplicates.length > 0) {
      scheduleErrors.push(`Duplicate ${schedule.type} schedule found for ${schedule.day} at ${schedule.time}`);
    }
  });
  
  if (scheduleErrors.length > 0) {
    return next(new Error(scheduleErrors.join(', ')));
  }
  
  next();
});

// Static methods
childSchema.statics.findByParent = function(parentId, isActive = true) {
  return this.find({ 
    parent: parentId, 
    isActive: isActive 
  }).sort({ createdAt: -1 });
};

childSchema.statics.findWithSchedules = function(childId) {
  return this.findById(childId)
    .populate('parent', 'firstName lastName email phone')
    .populate('subscription.driver', 'firstName lastName phone')
    .populate('subscription.group', 'name');
};

// Instance methods
childSchema.methods.addSchedule = function(scheduleData) {
  this.schedules.push(scheduleData);
  return this.save();
};

childSchema.methods.updateSchedule = function(scheduleId, updateData) {
  const schedule = this.schedules.id(scheduleId);
  if (schedule) {
    Object.assign(schedule, updateData);
  }
  return this.save();
};

childSchema.methods.removeSchedule = function(scheduleId) {
  this.schedules.pull(scheduleId);
  return this.save();
};

childSchema.methods.getActiveSchedules = function(day = null) {
  let schedules = this.schedules.filter(s => s.isActive);
  
  if (day) {
    schedules = schedules.filter(s => s.day === day);
  }
  
  return schedules.sort((a, b) => a.time.localeCompare(b.time));
};

childSchema.methods.getTodaysSchedules = function() {
  const today = new Date().toLowerCase().slice(0, 3);
  return this.getActiveSchedules(today);
};

const Child = mongoose.model('Child', childSchema);

module.exports = Child;
