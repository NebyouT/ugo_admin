// Auth Module Index File
// This file provides easy access to all auth module components

const User = require('./models/User');
const AuthController = require('./controllers/AuthController');
const ApiAuthController = require('./controllers/ApiAuthController');
const authRoutes = require('./routes/auth');
const apiAuthRoutes = require('./routes/apiAuth');
const { authenticate, authorize, adminOnly, optionalAuth, canAccess, authRateLimit, validateFields, sanitizeInput } = require('./middleware/auth');
const authConfig = require('./config/auth');

module.exports = {
    // Models
    User,
    
    // Controllers
    AuthController,
    ApiAuthController,
    
    // Routes
    authRoutes,
    apiAuthRoutes,
    
    // Middleware
    authenticate,
    authorize,
    adminOnly,
    optionalAuth,
    canAccess,
    authRateLimit,
    validateFields,
    sanitizeInput,
    
    // Configuration
    config: authConfig
};
