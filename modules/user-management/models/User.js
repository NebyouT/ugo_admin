const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserLevel = require('../models/UserLevel');

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // User Type and Role
  userType: {
    type: String,
    required: true,
    enum: ['customer', 'driver', 'admin', 'employee'],
    default: 'customer'
  },
  
  // Enhanced Customer Types (for userType: 'customer')
  customerType: {
    type: String,
    enum: ['regular', 'student', 'parent'],
    default: 'regular'
  },
  
  // Role Management
  role: {
    type: String,
    enum: ['customer', 'driver', 'admin', 'employee'],
    default: 'customer'
  },
  
  // Profile Information
  profileImage: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },
  
  // Identification
  identificationNumber: {
    type: String,
    default: null
  },
  identificationType: {
    type: String,
    enum: ['national_id', 'passport', 'driving_license', 'student_id'],
    default: null
  },
  identificationImage: {
    type: [String],
    default: []
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Student Specific Fields
  studentInfo: {
    studentId: {
      type: String,
      unique: true,
      sparse: true
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      default: null
    },
    grade: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    specialNeeds: [String],
    transportationNeeds: {
      requiresWheelchair: { type: Boolean, default: false },
      requiresSpecialAssistance: { type: Boolean, default: false },
      medicalConditions: [String]
    }
  },
  
  // Parent Specific Fields
  parentInfo: {
    occupation: String,
    company: String,
    workAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String
    }]
  },
  
  // Driver Specific Fields
  driverInfo: {
    licenseNumber: String,
    licenseExpiry: Date,
    licenseImage: String,
    vehicleAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null
    },
    isVerified: { type: Boolean, default: false },
    verificationDocuments: [String],
    serviceArea: String,
    rating: { type: Number, default: 0, min: 0, max: 5 }
  },
  
  // System Fields
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  phoneVerifiedAt: {
    type: Date,
    default: null
  },
  
  // Authentication Tokens
  fcmToken: String,
  refreshToken: String,
  
  // Loyalty and Points
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  userLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLevel',
    default: null
  },
  
  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastLoginAt: Date,
  isTempBlocked: {
    type: Boolean,
    default: false
  },
  tempBlockedUntil: Date,
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual Fields
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isStudent').get(function() {
  return this.userType === 'customer' && this.customerType === 'student';
});

userSchema.virtual('isParent').get(function() {
  return this.userType === 'customer' && this.customerType === 'parent';
});

userSchema.virtual('isRegularCustomer').get(function() {
  return this.userType === 'customer' && this.customerType === 'regular';
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ customerType: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ 'studentInfo.studentId': 1 });
userSchema.index({ 'driverInfo.licenseNumber': 1 });

// Middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateReferralCode = function() {
  if (this.referralCode) return this.referralCode;
  
  const code = `UGO${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  this.referralCode = code;
  return code;
};

userSchema.methods.getProfileCompletion = function() {
  const requiredFields = [
    'firstName', 'lastName', 'email', 'phone',
    'dateOfBirth', 'gender', 'address'
  ];
  
  const completed = requiredFields.filter(field => {
    if (field.includes('.')) {
      const parts = field.split('.');
      return this[parts[0]] && this[parts[0]][parts[1]];
    }
    return this[field];
  }).length;
  
  return Math.round((completed / requiredFields.length) * 100);
};

// Static Methods
userSchema.statics.findByEmailOrPhone = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phone: identifier }
    ]
  });
};

userSchema.statics.getCustomerStats = function() {
  return this.aggregate([
    { $match: { userType: 'customer' } },
    {
      $group: {
        _id: '$customerType',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);
