const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Web authentication middleware - redirects to login for web routes
const webAuthenticate = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies?.adminAuth;

        if (!token) {
            // Redirect to login page for web routes
            return res.redirect('/admin/login');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Find user by id
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            // Clear invalid token and redirect
            res.clearCookie('adminAuth');
            return res.redirect('/admin/login');
        }

        // Check if user is active
        if (user.status !== 'active') {
            // Clear token and redirect
            res.clearCookie('adminAuth');
            return res.redirect('/admin/login');
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        console.error('Web authentication error:', error.message);
        
        // Clear invalid token and redirect to login
        res.clearCookie('adminAuth');
        
        if (error.name === 'TokenExpiredError') {
            return res.redirect('/admin/login');
        } else if (error.name === 'JsonWebTokenError') {
            return res.redirect('/admin/login');
        }
        
        return res.redirect('/admin/login');
    }
};

// Web admin-only middleware
const webAdminOnly = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/admin/login');
    }

    if (req.user.role !== 'admin') {
        return res.status(403).render('error', { 
            title: 'Access Denied',
            message: 'You do not have permission to access this page.'
        });
    }

    next();
};

// Optional web authentication (doesn't redirect if not authenticated)
const webOptionalAuth = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies?.adminAuth;

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
        console.error('Optional web auth error:', error.message);
        next();
    }
};

module.exports = {
    webAuthenticate,
    webAdminOnly,
    webOptionalAuth
};
