// User Management Module Index

// Models
const User = require('./models/User');
const DriverDetail = require('./models/DriverDetail');
const UserRole = require('./models/UserRole');
const UserLevel = require('./models/UserLevel');

// Controllers
const UserManagementController = require('./controllers/UserManagementController');

// Routes
const userManagementRoutes = require('./routes/userManagement');

module.exports = {
  // Models
  User,
  DriverDetail,
  UserRole,
  UserLevel,
  
  // Controllers
  UserManagementController,
  
  // Routes
  userManagementRoutes,
  
  // Module info
  name: 'user-management',
  version: '1.0.0',
  description: 'Comprehensive user management system for UGO platform'
};
