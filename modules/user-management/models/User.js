const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserLevel = require("../models/UserLevel");

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: false, // FIXED: not required since API accepts single full_name
      trim: true,
      maxlength: 50,
      default: "",
    },
    email: {
      type: String,
      required: false, // FIXED: not required, auto-generated from phone
      unique: true,
      sparse: true, // FIXED: allows multiple null values with unique index
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    // User Type and Role
    userType: {
      type: String,
      required: true,
      enum: ["customer", "driver", "admin", "employee"],
      default: "customer",
    },

    // Enhanced Customer Types (for userType: 'customer')
    customerType: {
      type: String,
      enum: ["regular", "student", "parent"],
      default: "regular",
    },

    // Role Management
    role: {
      type: String,
      enum: ["customer", "driver", "admin", "employee", "parent"],
      default: "customer",
    },

    // Profile Information
    profileImage: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },

    // Identification
    identificationNumber: {
      type: String,
      default: null,
    },
    identificationType: {
      type: String,
      enum: ["national_id", "passport", "driving_license", "student_id"],
      required: false,
    },
    identificationImage: {
      type: [String],
      default: [],
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
        longitude: Number,
      },
    },

    // Student Specific Fields
    studentInfo: {
      studentId: {
        type: String,
        unique: true,
        sparse: true,
      },
      school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        default: null,
      },
      grade: String,
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },
      specialNeeds: [String],
      transportationNeeds: {
        requiresWheelchair: { type: Boolean, default: false },
        requiresSpecialAssistance: { type: Boolean, default: false },
        medicalConditions: [String],
      },
    },

    // Parent Specific Fields
    parentInfo: {
      occupation: {
        type: String,
        trim: true,
        maxlength: [100, "Occupation cannot exceed 100 characters"],
      },
      company: {
        type: String,
        trim: true,
        maxlength: [100, "Company name cannot exceed 100 characters"],
      },
      workAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
      emergencyContacts: [
        {
          name: {
            type: String,
            trim: true,
            maxlength: [
              100,
              "Emergency contact name cannot exceed 100 characters",
            ],
          },
          phone: {
            type: String,
            trim: true,
            validate: {
              validator: function (phone) {
                return !phone || /^[+]?[\d\s\-\(\)]+$/.test(phone);
              },
              message: "Invalid phone number format",
            },
          },
          relationship: {
            type: String,
            trim: true,
            maxlength: [50, "Relationship cannot exceed 50 characters"],
          },
          isPrimary: {
            type: Boolean,
            default: false,
          },
        },
      ],
      preferences: {
        language: {
          type: String,
          enum: ["english", "amharic", "oromo", "tigrinya"],
          default: "english",
        },
        timezone: {
          type: String,
          default: "Africa/Addis_Ababa",
        },
        currency: {
          type: String,
          enum: ["ETB", "USD"],
          default: "ETB",
        },
        distanceUnit: {
          type: String,
          enum: ["km", "miles"],
          default: "km",
        },
      },
      familySize: {
        type: Number,
        min: 1,
        max: 20,
        default: 1,
      },
      preferredCommunication: {
        type: String,
        enum: ["email", "phone", "sms", "whatsapp"],
        default: "email",
      },
    },

    // Driver Specific Fields
    driverInfo: {
      licenseNumber: String,
      licenseExpiry: Date,
      licenseImage: String,
      vehicleType: String,
      vehicleAssigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        default: null,
      },
      isVerified: { type: Boolean, default: false },
      verificationDocuments: [String],
      serviceArea: String,
      rating: { type: Number, default: 0, min: 0, max: 5 },
    },

    // Parent/Customer Specific Fields
    children: [
      {
        firstName: String,
        lastName: String,
        age: Number,
        gender: { type: String, enum: ["male", "female", "other", ""] },
        grade: String,
        dateOfBirth: Date,
        medicalInfo: String,
      },
    ],

    // System Fields
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },

    // Phone Change Fields
    pendingPhone: String,
    phoneChangeOTP: String,
    phoneChangeOTPExpiry: Date,

    // Authentication Tokens
    fcmToken: String,
    refreshToken: String,

    // Notification Preferences
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      pickupReminders: { type: Boolean, default: true },
      dropoffReminders: { type: Boolean, default: true },
      subscriptionUpdates: { type: Boolean, default: true },
      driverUpdates: { type: Boolean, default: true },
      paymentReminders: { type: Boolean, default: true },
      promotionalOffers: { type: Boolean, default: false },
    },

    // Loyalty and Points
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    userLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserLevel",
      default: null,
    },

    // Referral System
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Security
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastLoginAt: Date,
    lockUntil: {
      type: Date,
      default: null,
    },
    isTempBlocked: {
      type: Boolean,
      default: false,
    },
    tempBlockedUntil: Date,

    // Account status
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "deleted", "pending"],
      default: "active",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },

    // Account deletion
    deletionDate: Date,
    deletionReason: String,
    deletionFeedback: String,

    // OTP tracking
    otpAttempts: {
      type: Number,
      default: 0,
    },
    lastOTPSent: Date,

    // OTP Fields
    otp: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    otpPurpose: {
      type: String,
      enum: [
        null,
        "registration",
        "password_reset",
        "login_verification",
        "phone_verification",
      ],
      default: null,
      required: false,
    },
    otpGeneratedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },

    // Device Tracking
    deviceInfo: {
      device_id: String,
      device_type: {
        type: String,
        enum: ["web", "android", "ios", "desktop"],
        required: false,
        default: "web",
      },
      fcm_token: String,
      user_agent: String,
      ip_address: String,
    },

    // Preferences
    preferences: {
      language: {
        type: String,
        default: "en",
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual Fields
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual("isStudent").get(function () {
  return this.userType === "customer" && this.customerType === "student";
});

userSchema.virtual("isParent").get(function () {
  return this.userType === "customer" && this.customerType === "parent";
});

userSchema.virtual("isRegularCustomer").get(function () {
  return this.userType === "customer" && this.customerType === "regular";
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ customerType: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ "studentInfo.studentId": 1 });
userSchema.index({ "driverInfo.licenseNumber": 1 });

// Middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role || this.userType,
    userType: this.userType,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });
};

// Find user by credentials for authentication
userSchema.statics.findByCredentials = async function (email, password) {
  try {
    const user = await this.findOne({ email }).select("+password");

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account is not active");
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    return user;
  } catch (error) {
    throw error;
  }
};

// Instance Methods
userSchema.methods.generateReferralCode = function () {
  if (this.referralCode) return this.referralCode;

  const code = `UGO${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  this.referralCode = code;
  return code;
};

userSchema.methods.getProfileCompletion = function () {
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "dateOfBirth",
    "gender",
    "address",
  ];

  const completed = requiredFields.filter((field) => {
    if (field.includes(".")) {
      const parts = field.split(".");
      return this[parts[0]] && this[parts[0]][parts[1]];
    }
    return this[field];
  }).length;

  return Math.round((completed / requiredFields.length) * 100);
};

// Static Methods
userSchema.statics.findByEmailOrPhone = function (identifier) {
  return this.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });
};

userSchema.statics.getCustomerStats = function () {
  return this.aggregate([
    { $match: { userType: "customer" } },
    {
      $group: {
        _id: "$customerType",
        count: { $sum: 1 },
      },
    },
  ]);
};

// Parent-specific static methods
userSchema.statics.findParents = function (filters = {}) {
  const query = { userType: "parent", isActive: true, ...filters };
  return this.find(query).select("-password").sort({ createdAt: -1 });
};

userSchema.statics.getParentStats = function () {
  return this.aggregate([
    { $match: { userType: "parent", isActive: true } },
    {
      $group: {
        _id: null,
        totalParents: { $sum: 1 },
        activeParents: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        parentsWithChildren: {
          $sum: {
            $cond: [{ $gt: ["$familySize", 1] }, 1, 0],
          },
        },
      },
    },
  ]);
};

userSchema.statics.createParentIfNotExists = async function (parentData) {
  try {
    const existingParent = await this.findOne({
      $or: [
        { email: parentData.email?.toLowerCase() },
        { phone: parentData.phone },
      ],
    });

    if (existingParent) {
      return existingParent;
    }

    const parent = new this({
      firstName: parentData.firstName,
      lastName: parentData.lastName || "",
      email: parentData.email,
      phone: parentData.phone,
      password: parentData.password,
      userType: "parent",
      role: "parent",
      customerType: "parent",
      isActive: true,
      status: "active",
      emailVerified: false,
      isEmailVerified: false,
      isPhoneVerified: false,
      parentInfo: parentData.parentInfo || {},
      address: parentData.address || {},
      notificationPreferences: parentData.notificationPreferences || {},
    });

    await parent.save();
    console.log(`Parent created: ${parent.email}`);
    return parent;
  } catch (error) {
    console.error("Error creating parent:", error);
    throw error;
  }
};

// Create admin user if none exists
userSchema.statics.createAdminIfNotExists = async function () {
  try {
    const existingAdmin = await this.findOne({ role: "admin" });

    if (!existingAdmin) {
      const adminUser = new this({
        firstName: process.env.ADMIN_FIRST_NAME || "Admin",
        lastName: process.env.ADMIN_LAST_NAME || "User",
        email: process.env.ADMIN_EMAIL || "admin@ugo.com",
        phone: "0900000000",
        password: process.env.ADMIN_PASSWORD || "12345678",
        role: "admin",
        userType: "admin",
        isActive: true,
        status: "active",
        emailVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      });

      await adminUser.save();
      console.log("Default admin user created: admin@ugo.com / 12345678");
      return adminUser;
    }

    return existingAdmin;
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

// Find by credentials (login attempt tracking)
userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.isActive || user.status === "suspended") {
    throw new Error("Account is not active");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    await user.save();
    throw new Error("Invalid credentials");
  }

  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
  }
  user.lastLoginAt = new Date();
  await user.save();

  return user;
};

// Get user statistics
userSchema.statics.getStats = async function () {
  const total = await this.countDocuments();
  const active = await this.countDocuments({ isActive: true });
  const stats = await this.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);

  return {
    total,
    active,
    inactive: total - active,
    byRole: stats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {}),
  };
};

module.exports = mongoose.model("User", userSchema);
