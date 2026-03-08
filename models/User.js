const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'driver', 'parent'],
    default: 'student'
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  // Student specific fields
  studentId: {
    type: String,
    sparse: true
  },
  school: {
    type: String,
    sparse: true
  },
  grade: {
    type: String,
    sparse: true
  },
  // Driver specific fields
  licenseNumber: {
    type: String,
    sparse: true
  },
  vehicleNumber: {
    type: String,
    sparse: true
  },
  // Parent specific fields
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
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

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    role: this.role,
    phone: this.phone,
    profilePicture: this.profilePicture,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

// Static method to create admin user
userSchema.statics.createAdmin = async function(adminData) {
  const existingAdmin = await this.findOne({ email: adminData.email, role: 'admin' });
  if (existingAdmin) {
    throw new Error('Admin user already exists');
  }

  const admin = new this({
    ...adminData,
    role: 'admin',
    isActive: true
  });

  return await admin.save();
};

module.exports = mongoose.model('User', userSchema);
