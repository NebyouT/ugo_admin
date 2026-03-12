const mongoose = require('mongoose');

// Parent-Child Relationship Model
const parentChildRelationshipSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  child: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Relationship Details
  relationshipType: {
    type: String,
    enum: ['parent', 'guardian', 'caregiver'],
    default: 'parent'
  },
  
  // Custody and Permissions
  custodyType: {
    type: String,
    enum: ['full', 'joint', 'temporary'],
    default: 'full'
  },
  
  // Pickup and Drop-off Permissions
  pickupPermissions: {
    allowedPickupPersons: [{
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relationship: { type: String, required: true },
      identificationImage: String,
      isAuthorized: { type: Boolean, default: true }
    }],
    specialInstructions: String,
    emergencyOnly: { type: Boolean, default: false }
  },
  
  // Transportation Preferences
  transportationPreferences: {
    preferredVehicleType: String,
    specialRequirements: [String],
    accessibilityNeeds: [String],
    medicalEquipment: [String],
    allergies: [String],
    notes: String
  },
  
  // Schedule Information
  regularSchedule: [{
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    pickupTime: String,
    dropoffTime: String,
    pickupLocation: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    dropoffLocation: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    isActive: { type: Boolean, default: true }
  }],
  
  // Emergency Information
  emergencyInformation: {
    medicalConditions: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      instructions: String
    }],
    doctors: [{
      name: String,
      specialty: String,
      phone: String,
      hospital: String
    }],
    allergies: [String],
    bloodType: String,
    specialNeeds: String
  },
  
  // Communication Preferences
  communicationPreferences: {
    preferredLanguage: { type: String, default: 'en' },
    notificationMethods: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      app: { type: Boolean, default: true },
      phone: { type: Boolean, default: false }
    },
    emergencyNotifications: {
      immediate: { type: Boolean, default: true },
      delayed: { type: Boolean, default: false },
      dailySummary: { type: Boolean, default: true }
    }
  },
  
  // Status and Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    documentType: {
      type: String,
      enum: ['birth_certificate', 'court_order', 'guardianship_paper', 'adoption_papers', 'other']
    },
    documentUrl: String,
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Activity Tracking
  lastPickupDate: Date,
  lastDropoffDate: Date,
  totalTrips: { type: Number, default: 0 },
  
  // Notes and History
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['general', 'emergency', 'schedule_change', 'pickup_issue', 'behavioral']
    }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
parentChildRelationshipSchema.index({ parent: 1, child: 1 }, { unique: true });
parentChildRelationshipSchema.index({ parent: 1 });
parentChildRelationshipSchema.index({ child: 1 });
parentChildRelationshipSchema.index({ isActive: 1 });

// Virtual Fields
parentChildRelationshipSchema.virtual('childAge').get(function() {
  if (!this.child.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.child.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Instance Methods
parentChildRelationshipSchema.methods.addPickupPerson = function(personData) {
  this.pickupPermissions.allowedPickupPersons.push(personData);
  return this.save();
};

parentChildRelationshipSchema.methods.removePickupPerson = function(personId) {
  this.pickupPermissions.allowedPickupPersons = this.pickupPermissions.allowedPickupPersons.filter(
    person => person._id.toString() !== personId.toString()
  );
  return this.save();
};

parentChildRelationshipSchema.methods.addNote = function(content, addedBy, type = 'general') {
  this.notes.push({
    content,
    addedBy,
    type
  });
  return this.save();
};

parentChildRelationshipSchema.methods.getTodaySchedule = function() {
  const today = new Date().getDay();
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Map Sunday=0 to Saturday=6
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayMap[today]];
  
  return this.regularSchedule.filter(schedule => 
    schedule.dayOfWeek === dayName && schedule.isActive
  );
};

// Static Methods
parentChildRelationshipSchema.statics.findByParent = function(parentId) {
  return this.find({ parent: parentId, isActive: true })
    .populate('child', 'firstName lastName email phone customerType studentInfo')
    .populate('parent', 'firstName lastName email phone');
};

parentChildRelationshipSchema.statics.findByChild = function(childId) {
  return this.find({ child: childId, isActive: true })
    .populate('parent', 'firstName lastName email phone')
    .populate('child', 'firstName lastName email phone customerType studentInfo');
};

parentChildRelationshipSchema.statics.findActiveRelationships = function() {
  return this.find({ isActive: true })
    .populate('parent', 'firstName lastName email phone')
    .populate('child', 'firstName lastName email phone customerType studentInfo');
};

parentChildRelationshipSchema.statics.getRelationshipStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalRelationships: { $sum: 1 },
        verifiedRelationships: {
          $sum: { $cond: ['$isVerified', 1, 0] }
        },
        averageTripsPerChild: { $avg: '$totalTrips' }
      }
    }
  ]);
};

module.exports = mongoose.model('ParentChildRelationship', parentChildRelationshipSchema);
