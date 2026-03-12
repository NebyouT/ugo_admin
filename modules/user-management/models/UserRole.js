const mongoose = require('mongoose');
const UserLevel = require('../models/UserLevel');

const userRoleSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Role Type
  roleType: {
    type: String,
    enum: ['system', 'custom'],
    default: 'custom'
  },
  
  // User Type Association
  userType: {
    type: String,
    enum: ['customer', 'driver', 'admin', 'employee'],
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
      enum: ['create', 'read', 'update', 'delete', 'manage'],
      required: true
    }]
  }],
  
  // Module Access
  moduleAccess: [{
    moduleName: {
      type: String,
      required: true
    },
    canAccess: {
      type: Boolean,
      default: true
    },
    permissions: [{
      type: String,
      enum: ['view', 'create', 'edit', 'delete', 'export', 'import'],
      default: 'view'
    }]
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // User Count
  userCount: {
    type: Number,
    default: 0
  },
  
  // Visual Configuration
  badgeColor: {
    type: String,
    default: '#6c757d'
  },
  icon: {
    type: String,
    default: 'fas fa-user-tag'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual Fields
userRoleSchema.virtual('isSystemRole').get(function() {
  return this.roleType === 'system';
});

userRoleSchema.virtual('hasModuleAccess').get(function() {
  return this.moduleAccess.length > 0;
});

// Indexes
userRoleSchema.index({ name: 1 });
userRoleSchema.index({ userType: 1 });
userRoleSchema.index({ isActive: 1 });
userRoleSchema.index({ roleType: 1 });

// Instance Methods
userRoleSchema.methods.hasPermission = function(module, action) {
  const permission = this.permissions.find(p => p.module === module);
  if (!permission) return false;
  
  return permission.actions.includes(action) || permission.actions.includes('manage');
};

userRoleSchema.methods.canAccessModule = function(moduleName, permission = 'view') {
  const moduleAccess = this.moduleAccess.find(m => m.moduleName === moduleName);
  if (!moduleAccess) return false;
  
  return moduleAccess.canAccess && moduleAccess.permissions.includes(permission);
};

userRoleSchema.methods.addPermission = function(module, action) {
  const existingPermission = this.permissions.find(p => p.module === module);
  
  if (existingPermission) {
    if (!existingPermission.actions.includes(action)) {
      existingPermission.actions.push(action);
    }
  } else {
    this.permissions.push({ module, actions: [action] });
  }
  
  return this.save();
};

userRoleSchema.methods.removePermission = function(module, action) {
  const existingPermission = this.permissions.find(p => p.module === module);
  
  if (existingPermission) {
    existingPermission.actions = existingPermission.actions.filter(a => a !== action);
    
    if (existingPermission.actions.length === 0) {
      this.permissions = this.permissions.filter(p => p.module !== module);
    }
  }
  
  return this.save();
};

userRoleSchema.methods.addModuleAccess = function(moduleName, permissions = ['view']) {
  const existingAccess = this.moduleAccess.find(m => m.moduleName === moduleName);
  
  if (existingAccess) {
    existingAccess.canAccess = true;
    existingAccess.permissions = [...new Set([...existingAccess.permissions, ...permissions])];
  } else {
    this.moduleAccess.push({
      moduleName,
      canAccess: true,
      permissions
    });
  }
  
  return this.save();
};

userRoleSchema.methods.removeModuleAccess = function(moduleName) {
  const existingAccess = this.moduleAccess.find(m => m.moduleName === moduleName);
  
  if (existingAccess) {
    existingAccess.canAccess = false;
  }
  
  return this.save();
};

userRoleSchema.methods.incrementUserCount = function() {
  this.userCount += 1;
  return this.save();
};

userRoleSchema.methods.decrementUserCount = function() {
  this.userCount = Math.max(0, this.userCount - 1);
  return this.save();
};

// Static Methods
userRoleSchema.statics.findByUserType = function(userType) {
  return this.find({ userType, isActive: true }).sort({ name: 1 });
};

userRoleSchema.statics.getSystemRoles = function() {
  return this.find({ roleType: 'system', isActive: true }).sort({ name: 1 });
};

userRoleSchema.statics.getCustomRoles = function() {
  return this.find({ roleType: 'custom', isActive: true }).sort({ name: 1 });
};

userRoleSchema.statics.createDefaultRoles = async function() {
  const defaultRoles = [
    {
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full system access',
      roleType: 'system',
      userType: 'admin',
      permissions: [
        { module: 'all', actions: ['manage'] }
      ],
      moduleAccess: [
        { moduleName: 'all', canAccess: true, permissions: ['view', 'create', 'edit', 'delete', 'export', 'import'] }
      ],
      badgeColor: '#dc3545',
      icon: 'fas fa-crown'
    },
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrative access',
      roleType: 'system',
      userType: 'admin',
      permissions: [
        { module: 'users', actions: ['read', 'update'] },
        { module: 'trips', actions: ['read', 'update'] },
        { module: 'vehicles', actions: ['read', 'update'] },
        { module: 'reports', actions: ['read', 'export'] }
      ],
      moduleAccess: [
        { moduleName: 'users', canAccess: true, permissions: ['view', 'edit'] },
        { moduleName: 'trips', canAccess: true, permissions: ['view', 'edit'] },
        { moduleName: 'vehicles', canAccess: true, permissions: ['view', 'edit'] },
        { moduleName: 'reports', canAccess: true, permissions: ['view', 'export'] }
      ],
      badgeColor: '#fd7e14',
      icon: 'fas fa-user-shield'
    },
    {
      name: 'customer',
      displayName: 'Customer',
      description: 'Regular customer access',
      roleType: 'system',
      userType: 'customer',
      permissions: [
        { module: 'trips', actions: ['create', 'read'] },
        { module: 'profile', actions: ['read', 'update'] }
      ],
      moduleAccess: [
        { moduleName: 'trips', canAccess: true, permissions: ['view', 'create'] },
        { moduleName: 'profile', canAccess: true, permissions: ['view', 'edit'] }
      ],
      badgeColor: '#28a745',
      icon: 'fas fa-user'
    },
    {
      name: 'driver',
      displayName: 'Driver',
      description: 'Driver access',
      roleType: 'system',
      userType: 'driver',
      permissions: [
        { module: 'trips', actions: ['read', 'update'] },
        { module: 'profile', actions: ['read', 'update'] },
        { module: 'earnings', actions: ['read'] }
      ],
      moduleAccess: [
        { moduleName: 'trips', canAccess: true, permissions: ['view', 'edit'] },
        { moduleName: 'profile', canAccess: true, permissions: ['view', 'edit'] },
        { moduleName: 'earnings', canAccess: true, permissions: ['view'] }
      ],
      badgeColor: '#007bff',
      icon: 'fas fa-id-card'
    }
  ];
  
  const createdRoles = [];
  
  for (const roleData of defaultRoles) {
    const existingRole = await this.findOne({ name: roleData.name });
    if (!existingRole) {
      const role = new this(roleData);
      await role.save();
      createdRoles.push(role);
    } else {
      createdRoles.push(existingRole);
    }
  }
  
  return createdRoles;
};

userRoleSchema.statics.updateUserCounts = async function() {
  const User = mongoose.model('User');
  
  // Get all active roles
  const roles = await this.find({ isActive: true });
  
  // Reset all user counts to 0
  await this.updateMany({}, { userCount: 0 });
  
  // Count users in each role
  for (const role of roles) {
    const userCount = await User.countDocuments({
      role: role.name,
      isActive: true
    });
    
    await this.findByIdAndUpdate(role._id, { userCount });
  }
  
  return roles;
};

userRoleSchema.statics.getRoleStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$userType',
        totalRoles: { $sum: 1 },
        totalUsers: { $sum: '$userCount' },
        roles: { $push: '$$ROOT' }
      }
    }
  ]);
};

module.exports = mongoose.model('UserRole', userRoleSchema);
