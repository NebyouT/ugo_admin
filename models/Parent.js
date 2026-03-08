const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    subCity: {
      type: String,
      required: [true, 'Sub-city is required'],
      trim: true
    },
    woreda: {
      type: String,
      required: [true, 'Woreda is required'],
      trim: true
    },
    houseNumber: {
      type: String,
      trim: true
    }
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      enum: ['Spouse', 'Sibling', 'Parent', 'Relative', 'Friend', 'Other'],
      default: 'Relative'
    }
  },
  occupation: {
    type: String,
    trim: true,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  workplace: {
    type: String,
    trim: true,
    maxlength: [100, 'Workplace cannot exceed 100 characters']
  },
  idType: {
    type: String,
    required: [true, 'ID type is required'],
    enum: ['National ID', 'Passport', 'Driver License', 'Other']
  },
  idNumber: {
    type: String,
    required: [true, 'ID number is required'],
    trim: true,
    unique: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for full name
parentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address
parentSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.address.street,
    this.address.houseNumber,
    this.address.subCity,
    this.address.woreda,
    this.address.city
  ].filter(Boolean);
  return parts.join(', ');
});

// Indexes for better performance
parentSchema.index({ email: 1 });
parentSchema.index({ idNumber: 1 });
parentSchema.index({ isActive: 1 });
parentSchema.index({ registeredBy: 1 });
parentSchema.index({ 'address.city': 1 });

// Pre-save middleware to update lastUpdated
parentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to get public profile
parentSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    address: this.address,
    emergencyContact: this.emergencyContact,
    occupation: this.occupation,
    workplace: this.workplace,
    idType: this.idType,
    idNumber: this.idNumber,
    profilePicture: this.profilePicture,
    children: this.children,
    isActive: this.isActive,
    registrationDate: this.registrationDate,
    lastUpdated: this.lastUpdated
  };
};

// Static method to create parent with validation
parentSchema.statics.createParent = async function(parentData, registeredBy) {
  const parent = new this({
    ...parentData,
    registeredBy
  });
  
  return await parent.save();
};

// Static method to find active parents
parentSchema.statics.findActiveParents = function(filter = {}) {
  return this.find({ ...filter, isActive: true })
    .populate('registeredBy', 'firstName lastName email')
    .populate('children', 'firstName lastName email studentId');
};

module.exports = mongoose.model('Parent', parentSchema);
