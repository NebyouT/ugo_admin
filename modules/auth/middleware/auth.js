const jwt = require('jsonwebtoken');
// Use the canonical User model from user-management module
const User = require('../../user-management/models/User');

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        // Get token from cookie or header
        const token = req.cookies?.adminAuth || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Find user by id
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is not active.'
            });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        console.error('Authentication error:', error.message);
        
        let message = 'Invalid token.';
        
        if (error.name === 'TokenExpiredError') {
            message = 'Token expired.';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid token format.';
        }

        return res.status(401).json({
            success: false,
            message: message
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Admin-only middleware
const adminOnly = authorize('admin');

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        // Get token from cookie or header
        const token = req.cookies?.adminAuth || req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

            // Find user by id
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.status === 'active') {
                req.user = user;
            }
        }

        next();

    } catch (error) {
        // Don't fail on optional auth, just continue without user
        next();
    }
};

// Middleware to check if user can access resource (owner or admin)
const canAccess = (resourceUserField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        // Admin can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user is the owner of the resource
        const resourceUserId = req.params[resourceUserField] || req.body[resourceUserField];
        
        if (req.user._id.toString() === resourceUserId) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own resources.'
        });
    };
};

// Rate limiting middleware for auth endpoints
const authRateLimit = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const key = req.ip + req.path;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        for (const [ip, timestamps] of requests.entries()) {
            const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
            if (validTimestamps.length === 0) {
                requests.delete(ip);
            } else {
                requests.set(ip, validTimestamps);
            }
        }

        // Check current IP
        const timestamps = requests.get(key) || [];
        
        if (timestamps.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Add current request
        timestamps.push(now);
        requests.set(key, timestamps);

        next();
    };
};

// Middleware to validate required fields
const validateFields = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        next();
    };
};

// Middleware to sanitize input
const sanitizeInput = (req, res, next) => {
    // Remove any potential script tags or malicious content
    const sanitize = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Basic sanitization - remove script tags and trim
                sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
            } else if (typeof value === 'object') {
                sanitized[key] = sanitize(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    next();
};

module.exports = {
    authenticate,
    authorize,
    adminOnly,
    optionalAuth,
    canAccess,
    authRateLimit,
    validateFields,
    sanitizeInput
};
