const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    default: null
  },
  school: {
    id: { type: String, default: null },
    name: { type: String, default: null }
  },
  grade: {
    type: String,
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  pickupLocation: {
    address: { type: String, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  emergencyContact: {
    name: { type: String, default: null },
    phone: { type: String, default: null },
    relationship: { type: String, default: null }
  },
  medicalNotes: {
    type: String,
    default: null
  },
  subscription: {
    id: { type: String, default: null },
    status: { type: String, enum: ['active', 'inactive', 'pending', null], default: null },
    groupName: { type: String, default: null },
    driverName: { type: String, default: null },
    group: {
      id: { type: String, default: null },
      name: { type: String, default: null }
    },
    driver: {
      id: { type: String, default: null },
      name: { type: String, default: null },
      phone: { type: String, default: null },
      rating: { type: Number, default: null }
    },
    schedule: {
      pickupTime: { type: String, default: null },
      dropTime: { type: String, default: null }
    },
    price: { type: Number, default: null },
    startDate: { type: Date, default: null },
    paymentDue: { type: Date, default: null }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

childSchema.index({ parent: 1 });
childSchema.index({ 'school.id': 1 });

module.exports = mongoose.model('Child', childSchema);
