const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
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
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(dob) {
        const today = new Date();
        const birthDate = new Date(dob);
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1 >= 0 && age - 1 <= 18;
        }
        
        return age >= 0 && age <= 18;
      },
      message: 'Child age must be between 0 and 18 years'
    }
  },
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    enum: [
      'Kindergarten 1', 'Kindergarten 2', 'Kindergarten 3',
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
      'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
      'Grade 11', 'Grade 12', 'Preparatory', 'Other'
    ]
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School is required']
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parent',
    required: [true, 'Parent is required']
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [20, 'Student ID cannot exceed 20 characters']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  photo: {
    type: String,
    default: null
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      validate: {
        validator: function(phone) {
          return !phone || /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone);
        },
        message: 'Please enter a valid phone number'
      }
    },
    relationship: {
      type: String,
      enum: ['Mother', 'Father', 'Guardian', 'Relative', 'Other']
    }
  },
  medicalInfo: {
    allergies: [{
      type: String,
      trim: true
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String
    }],
    medicalConditions: [{
      type: String,
      trim: true
    }],
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
    },
    doctor: {
      name: String,
      phone: String,
      clinic: String
    }
  },
  transportation: {
    needsTransport: {
      type: Boolean,
      default: false
    },
    pickupAddress: {
      type: String,
      trim: true
    },
    dropoffAddress: {
      type: String,
      trim: true
    },
    specialInstructions: {
      type: String,
      maxlength: [500, 'Special instructions cannot exceed 500 characters']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
childSchema.index({ firstName: 1, lastName: 1 });
childSchema.index({ parent: 1 });
childSchema.index({ school: 1 });
childSchema.index({ grade: 1 });
childSchema.index({ isActive: 1 });
childSchema.index({ studentId: 1 });

// Virtuals
childSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

childSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

childSchema.virtual('gradeLevel').get(function() {
  if (this.grade.includes('Kindergarten')) return 'Kindergarten';
  if (this.grade.includes('Grade 1') || this.grade.includes('Grade 2') || this.grade.includes('Grade 3')) return 'Lower Primary';
  if (this.grade.includes('Grade 4') || this.grade.includes('Grade 5') || this.grade.includes('Grade 6')) return 'Upper Primary';
  if (this.grade.includes('Grade 7') || this.grade.includes('Grade 8')) return 'Middle School';
  if (this.grade.includes('Grade 9') || this.grade.includes('Grade 10')) return 'Lower Secondary';
  if (this.grade.includes('Grade 11') || this.grade.includes('Grade 12')) return 'Upper Secondary';
  return 'Other';
});

// Static methods
childSchema.statics = {
  // Generate unique student ID
  async generateStudentId() {
    const year = new Date().getFullYear();
    const prefix = `UGO${year}`;
    
    // Find the highest existing student ID for this year
    const lastChild = await this.findOne({ 
      studentId: { $regex: `^${prefix}` } 
    }).sort({ studentId: -1 });
    
    let sequenceNumber = 1;
    if (lastChild && lastChild.studentId) {
      const lastSequence = parseInt(lastChild.studentId.replace(prefix, ''));
      sequenceNumber = lastSequence + 1;
    }
    
    return `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
  },

  // Get children by parent
  async findByParent(parentId) {
    return this.find({ 
      parent: parentId, 
      isActive: true 
    }).populate('school', 'name type location.city');
  },

  // Get children by school
  async findBySchool(schoolId) {
    return this.find({ 
      school: schoolId, 
      isActive: true 
    }).populate('parent', 'firstName lastName email phone');
  },

  // Get child statistics
  async getStats() {
    const stats = await this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalChildren: { $sum: 1 },
          gradeDistribution: {
            $push: {
              grade: '$grade',
              count: 1
            }
          },
          genderDistribution: {
            $push: {
              gender: '$gender',
              count: 1
            }
          },
          schoolDistribution: {
            $push: {
              school: '$school',
              count: 1
            }
          },
          ageGroups: {
            $push: {
              ageGroup: {
                $switch: {
                  branches: [
                    { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 365 * 5 * 24 * 60 * 60 * 1000] }, then: '0-5 years' },
                    { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 365 * 10 * 24 * 60 * 60 * 1000] }, then: '6-10 years' },
                    { case: { $lt: [{ $subtract: [new Date(), '$dateOfBirth'] }, 365 * 15 * 24 * 60 * 60 * 1000] }, then: '11-15 years' }
                  ],
                  default: '16-18 years'
                }
              },
              count: 1
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalChildren: 0,
      gradeDistribution: [],
      genderDistribution: [],
      schoolDistribution: [],
      ageGroups: []
    };

    // Group by grade
    const gradeStats = {};
    result.gradeDistribution.forEach(item => {
      gradeStats[item.grade] = (gradeStats[item.grade] || 0) + 1;
    });

    // Group by gender
    const genderStats = {};
    result.genderDistribution.forEach(item => {
      genderStats[item.gender] = (genderStats[item.gender] || 0) + 1;
    });

    // Group by age
    const ageStats = {};
    result.ageGroups.forEach(item => {
      ageStats[item.ageGroup] = (ageStats[item.ageGroup] || 0) + 1;
    });

    return {
      totalChildren: result.totalChildren,
      gradeDistribution: Object.entries(gradeStats).map(([grade, count]) => ({ _id: grade, count })),
      genderDistribution: Object.entries(genderStats).map(([gender, count]) => ({ _id: gender, count })),
      ageDistribution: Object.entries(ageStats).map(([ageGroup, count]) => ({ _id: ageGroup, count })),
      schoolDistribution: result.schoolDistribution
    };
  },

  // Search children
  async searchChildren(query, filters = {}) {
    const searchCriteria = {
      isActive: true,
      ...filters
    };

    if (query) {
      searchCriteria.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { studentId: { $regex: query, $options: 'i' } }
      ];
    }

    return this.find(searchCriteria)
      .populate('school', 'name type location.city')
      .populate('parent', 'firstName lastName email phone')
      .sort({ firstName: 1, lastName: 1 });
  }
};

// Instance methods
childSchema.methods = {
  // Get public profile
  getPublicProfile() {
    return {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth,
      age: this.age,
      grade: this.grade,
      gradeLevel: this.gradeLevel,
      school: this.school,
      studentId: this.studentId,
      gender: this.gender,
      photo: this.photo,
      emergencyContact: this.emergencyContact,
      transportation: this.transportation,
      isActive: this.isActive,
      enrollmentDate: this.enrollmentDate
    };
  },

  // Generate student ID if not exists
  async generateStudentId() {
    if (!this.studentId) {
      this.studentId = await this.constructor.generateStudentId();
      return this.save();
    }
    return this;
  },

  // Toggle active status
  async toggleStatus() {
    this.isActive = !this.isActive;
    return this.save();
  },

  // Update school
  async updateSchool(newSchoolId) {
    this.school = newSchoolId;
    return this.save();
  }
};

// Pre-save middleware
childSchema.pre('save', async function(next) {
  // Generate student ID if not provided
  if (!this.studentId && this.isNew) {
    this.studentId = await this.constructor.generateStudentId();
  }
  
  next();
});

const Child = mongoose.model('Child', childSchema);

module.exports = Child;
