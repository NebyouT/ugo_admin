const mongoose = require('mongoose');

const userLevelSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Level Configuration
  level: {
    type: Number,
    required: true,
    min: 1
  },
  minPoints: {
    type: Number,
    required: true,
    min: 0
  },
  maxPoints: {
    type: Number,
    default: null // null for highest level
  },
  
  // Benefits and Rewards
  benefits: [{
    type: String,
    description: String
  }],
  
  // Points Configuration
  pointsPerRide: {
    type: Number,
    default: 1
  },
  pointsPerParcel: {
    type: Number,
    default: 1
  },
  
  // Discount Configuration
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  maxDiscountPerRide: {
    type: Number,
    default: 0
  },
  
  // Priority Features
  priorityBooking: {
    type: Boolean,
    default: false
  },
  prioritySupport: {
    type: Boolean,
    default: false
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Visual Configuration
  badgeColor: {
    type: String,
    default: '#6c757d'
  },
  badgeIcon: {
    type: String,
    default: 'fas fa-user'
  },
  
  // User Count (automatically updated)
  userCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual Fields
userLevelSchema.virtual('isTopLevel').get(function() {
  return this.maxPoints === null;
});

userLevelSchema.virtual('pointRange').get(function() {
  if (this.isTopLevel) {
    return `${this.minPoints}+ points`;
  }
  return `${this.minPoints} - ${this.maxPoints} points`;
});

// Indexes
userLevelSchema.index({ level: 1 });
userLevelSchema.index({ minPoints: 1 });
userLevelSchema.index({ maxPoints: 1 });
userLevelSchema.index({ isActive: 1 });

// Instance Methods
userLevelSchema.methods.isInLevel = function(points) {
  if (this.isTopLevel) {
    return points >= this.minPoints;
  }
  return points >= this.minPoints && points < this.maxPoints;
};

userLevelSchema.methods.getNextLevel = function() {
  return this.constructor.findOne({ 
    level: this.level + 1,
    isActive: true 
  });
};

userLevelSchema.methods.getProgressToNext = function(currentPoints) {
  const nextLevel = this.getNextLevel();
  if (!nextLevel) {
    return { progress: 100, pointsNeeded: 0 };
  }
  
  const pointsInCurrentLevel = currentPoints - this.minPoints;
  const totalPointsInLevel = nextLevel.minPoints - this.minPoints;
  const progress = Math.min(100, Math.round((pointsInCurrentLevel / totalPointsInLevel) * 100));
  const pointsNeeded = Math.max(0, nextLevel.minPoints - currentPoints);
  
  return { progress, pointsNeeded };
};

userLevelSchema.methods.incrementUserCount = function() {
  this.userCount += 1;
  return this.save();
};

userLevelSchema.methods.decrementUserCount = function() {
  this.userCount = Math.max(0, this.userCount - 1);
  return this.save();
};

// Static Methods
userLevelSchema.statics.findLevelByPoints = function(points) {
  return this.findOne({
    minPoints: { $lte: points },
    $or: [
      { maxPoints: null },
      { maxPoints: { $gt: points } }
    ],
    isActive: true
  }).sort({ level: -1 });
};

userLevelSchema.statics.getDefaultLevel = function() {
  return this.findOne({ 
    level: 1,
    isActive: true 
  });
};

userLevelSchema.statics.getAllLevels = function() {
  return this.find({ isActive: true }).sort({ level: 1 });
};

userLevelSchema.statics.getLevelStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalLevels: { $sum: 1 },
        totalUsers: { $sum: '$userCount' },
        averageUsersPerLevel: { $avg: '$userCount' },
        maxUsersInLevel: { $max: '$userCount' },
        minUsersInLevel: { $min: '$userCount' }
      }
    }
  ]);
};

userLevelSchema.statics.updateUserCounts = async function() {
  const User = mongoose.model('User');
  
  // Get all active levels
  const levels = await this.find({ isActive: true }).sort({ level: 1 });
  
  // Reset all user counts to 0
  await this.updateMany({}, { userCount: 0 });
  
  // Count users in each level
  for (const level of levels) {
    const userCount = await User.countDocuments({
      userLevel: level._id,
      isActive: true
    });
    
    await this.findByIdAndUpdate(level._id, { userCount });
  }
  
  return levels;
};

// Middleware
userLevelSchema.pre('save', async function(next) {
  // Ensure level uniqueness
  if (this.isNew || this.isModified('level')) {
    const existingLevel = await this.constructor.findOne({ 
      level: this.level,
      _id: { $ne: this._id }
    });
    
    if (existingLevel) {
      const error = new Error(`Level ${this.level} already exists`);
      next(error);
      return;
    }
  }
  
  next();
});

module.exports = mongoose.model('UserLevel', userLevelSchema);
