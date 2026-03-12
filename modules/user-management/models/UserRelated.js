const mongoose = require('mongoose');

// User Level Model (for loyalty system)
const userLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true,
    unique: true
  },
  minPoints: {
    type: Number,
    required: true
  },
  maxPoints: {
    type: Number,
    default: null
  },
  
  // Benefits and Features
  benefits: [{
    type: {
      type: String,
      enum: ['discount_percentage', 'free_rides', 'priority_booking', 'special_offers', 'points_multiplier']
    },
    value: mongoose.Schema.Types.Mixed,
    description: String
  }],
  
  // Level-specific settings
  rideDiscountPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  pointsMultiplier: {
    type: Number,
    default: 1,
    min: 0
  },
  freeRidesPerMonth: {
    type: Number,
    default: 0
  },
  
  // Visual and Status
  color: {
    type: String,
    default: '#000000'
  },
  icon: String,
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Requirements for level maintenance
  requiredMonthlyRides: {
    type: Number,
    default: 0
  },
  requiredMonthlySpending: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Role Model
const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Permissions
  permissions: [{
    module: {
      type: String,
      required: true
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'manage']
    }]
  }],
  
  // Role Hierarchy
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // User Assignment
  userCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// User Account Model (for wallet and financial management)
const userAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Wallet Balance
  walletBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Financial Information
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Transaction Limits
  dailySpendingLimit: {
    type: Number,
    default: 1000
  },
  monthlySpendingLimit: {
    type: Number,
    default: 10000
  },
  
  // Payment Methods
  paymentMethods: [{
    type: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_account', 'digital_wallet'],
      required: true
    },
    provider: String,
    lastFour: String,
    expiryDate: String,
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Withdrawal Methods (for drivers)
  withdrawalMethods: [{
    type: {
      type: String,
      enum: ['bank_account', 'digital_wallet', 'cash'],
      required: true
    },
    provider: String,
    accountNumber: String,
    accountName: String,
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Statistics
  totalEarned: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0
  },
  
  // Account Status
  isFrozen: {
    type: Boolean,
    default: false
  },
  freezeReason: String,
  frozenAt: Date,
  
  // Credit Information
  creditScore: {
    type: Number,
    default: 500,
    min: 300,
    max: 850
  },
  creditLimit: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// User Level History
const userLevelHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLevel',
    required: true
  },
  newLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLevel',
    required: true
  },
  reason: {
    type: String,
    enum: ['points_earned', 'points_lost', 'admin_action', 'system_upgrade'],
    required: true
  },
  pointsAtChange: {
    type: Number,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
userLevelSchema.index({ level: 1 });
userLevelSchema.index({ minPoints: 1 });
roleSchema.index({ level: 1 });
userAccountSchema.index({ user: 1 });
userAccountSchema.index({ walletBalance: 1 });
userLevelHistorySchema.index({ user: 1 });
userLevelHistorySchema.index({ newLevel: 1 });

module.exports = {
  UserLevel: mongoose.model('UserLevel', userLevelSchema),
  Role: mongoose.model('Role', roleSchema),
  UserAccount: mongoose.model('UserAccount', userAccountSchema),
  UserLevelHistory: mongoose.model('UserLevelHistory', userLevelHistorySchema)
};
