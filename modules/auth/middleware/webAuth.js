const jwt = require('jsonwebtoken');
// Use the canonical User model from user-management module
const User = require('../../user-management/models/User');

// Web authentication middleware - redirects to login for web routes
const cookieClearOpts = { path: '/', httpOnly: true };

const webAuthenticate = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies?.adminAuth;

        if (!token) {
            return res.redirect('/admin/login');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Find user by id
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            res.clearCookie('adminAuth', cookieClearOpts);
            return res.redirect('/admin/login');
        }

        if (!user.isActive) {
            res.clearCookie('adminAuth', cookieClearOpts);
            return res.redirect('/admin/login');
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('Web authentication error:', error.message);
        res.clearCookie('adminAuth', cookieClearOpts);
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

            if (user && user.isActive) {
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
