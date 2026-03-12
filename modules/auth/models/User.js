const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    phone: {
        type: String,
        trim: true,
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    role: {
        type: String,
        enum: ['admin', 'driver', 'parent', 'student', 'employee'],
        default: 'student'
    },
    userType: {
        type: String,
        enum: ['admin', 'driver', 'parent', 'student', 'employee'],
        default: 'student'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    profileImage: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    // Additional fields for specific roles
    driverDetails: {
        licenseNumber: String,
        licenseExpiry: Date,
        vehicleAssigned: mongoose.Schema.Types.ObjectId,
        experience: Number,
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        }
    },
    parentDetails: {
        children: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        address: String,
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String
        }
    },
    studentDetails: {
        school: mongoose.Schema.Types.ObjectId,
        grade: String,
        busRoute: mongoose.Schema.Types.ObjectId,
        parent: mongoose.Schema.Types.ObjectId
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods

// Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
    const payload = {
        id: this._id,
        email: this.email,
        role: this.role,
        userType: this.userType
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { lastLogin: new Date() }
    });
};

// Find user by credentials for authentication
userSchema.statics.findByCredentials = async function(email, password) {
    try {
        // Find user by email with password field included
        const user = await this.findOne({ email }).select('+password');
        
        if (!user) {
            throw new Error('Invalid credentials');
        }
        
        // Check if account is locked
        if (user.isLocked) {
            throw new Error('Account is temporarily locked due to multiple failed login attempts');
        }
        
        // Check if account is active
        if (user.status !== 'active') {
            throw new Error('Account is not active');
        }
        
        // Compare password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            // Increment login attempts
            await user.incLoginAttempts();
            throw new Error('Invalid credentials');
        }
        
        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        
        return user;
    } catch (error) {
        throw error;
    }
};

// Create admin user if none exists
userSchema.statics.createAdminIfNotExists = async function() {
    try {
        const existingAdmin = await this.findOne({ role: 'admin' });
        
        if (!existingAdmin) {
            const adminUser = new this({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@ugo.com',
                password: '12345678', // Will be hashed by pre-save middleware
                role: 'admin',
                userType: 'admin',
                status: 'active',
                emailVerified: true
            });
            
            await adminUser.save();
            console.log('Default admin user created: admin@ugo.com / 12345678');
            return adminUser;
        }
        
        return existingAdmin;
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// Static methods for role-based queries
userSchema.statics.findByRole = function(role) {
    return this.find({ role, status: 'active' });
};

userSchema.statics.findActiveUsers = function() {
    return this.find({ status: 'active' });
};

// Get user statistics
userSchema.statics.getStats = async function() {
    try {
        const stats = await this.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const totalUsers = await this.countDocuments();
        const activeUsers = await this.countDocuments({ status: 'active' });
        
        return {
            total: totalUsers,
            active: activeUsers,
            inactive: totalUsers - activeUsers,
            byRole: stats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        };
    } catch (error) {
        throw new Error('Failed to get user statistics');
    }
};

module.exports = mongoose.model('AuthUser', userSchema);
