module.exports = {
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'ugo-admin',
        audience: 'ugo-users'
    },

    // Password Configuration
    password: {
        minLength: 6,
        saltRounds: 12,
        maxLoginAttempts: 5,
        lockoutTime: 2 * 60 * 60 * 1000 // 2 hours in milliseconds
    },

    // Session Configuration
    session: {
        cookieName: 'adminAuth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    },

    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 requests per window
        message: 'Too many login attempts, please try again later.',
        standardHeaders: true,
        legacyHeaders: false
    },

    // Email Configuration (for password reset)
    email: {
        from: process.env.EMAIL_FROM || 'noreply@ugo.com',
        resetPasswordSubject: 'UGO - Password Reset Request',
        verificationSubject: 'UGO - Email Verification'
    },

    // Default Admin User
    defaultAdmin: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@ugo.com',
        password: '12345678',
        role: 'admin',
        userType: 'admin'
    }
};
