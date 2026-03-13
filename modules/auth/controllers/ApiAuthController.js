const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../user-management/models/User');
const DriverDetail = require('../../user-management/models/DriverDetail');
const { generateOTP, verifyOTP, generatePhoneMask } = require('../utils/otpUtils');

// Helper: generate access token
function generateAccessToken(user) {
    return jwt.sign(
        { id: user._id, phone: user.phone, userType: user.userType || user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
    );
}

// Helper: generate refresh token
function generateRefreshToken(user) {
    return jwt.sign(
        { id: user._id, phone: user.phone },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret',
        { expiresIn: '7d' }
    );
}

// Helper: map userType for API responses
function mapUserType(user) {
    if (user.userType === 'customer' && user.customerType === 'parent') return 'parent';
    if (user.userType === 'customer' && user.customerType === 'student') return 'student';
    return user.userType; // driver, admin, employee, customer
}

class ApiAuthController {
    // 1. POST /auth/register - Register new user
    static async register(req, res) {
        try {
            const { user_type, full_name, phone, password, confirm_password, device_info } = req.body;

            // Validation
            if (!user_type || !full_name || !phone || !password || !confirm_password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'All required fields must be provided'
                    }
                });
            }

            if (password !== confirm_password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PASSWORD_MISMATCH',
                        message: 'Passwords do not match'
                    }
                });
            }

            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'WEAK_PASSWORD',
                        message: 'Password must be at least 8 characters with numbers and letters'
                    }
                });
            }

            // Check if phone already exists
            const existingUser = await User.findOne({ phone });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PHONE_EXISTS',
                        message: 'This phone number is already registered'
                    }
                });
            }

            // Parse name
            const nameParts = full_name.trim().split(/\s+/);
            const firstName = nameParts[0] || full_name;
            const lastName = nameParts.slice(1).join(' ') || '';

            // Build user data
            const userData = {
                firstName,
                lastName,
                phone,
                email: `${phone}@ugo.temp`, // Auto-generate email from phone (phone is primary identifier)
                password, // Will be hashed by pre-save middleware
                isActive: false, // Requires OTP verification
                status: 'pending',
                otp: generateOTP(), // Currently hardcoded to 123456
                otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
                otpPurpose: 'registration',
                otpAttempts: 0,
                lastOTPSent: new Date()
            };

            // Set user type and customer type
            if (user_type === 'parent') {
                userData.userType = 'customer';
                userData.customerType = 'parent';
                userData.role = 'customer';
            } else if (user_type === 'driver') {
                userData.userType = 'driver';
                userData.role = 'driver';
            } else {
                userData.userType = 'customer';
                userData.customerType = 'regular';
                userData.role = 'customer';
            }

            // Device info
            if (device_info) {
                userData.deviceInfo = {
                    device_id: device_info.device_id,
                    device_type: device_info.device_type || 'android',
                    fcm_token: device_info.fcm_token
                };
                if (device_info.fcm_token) {
                    userData.fcmToken = device_info.fcm_token;
                }
            }

            // Add driver-specific fields
            if (user_type === 'driver') {
                const { date_of_birth, address, license_number } = req.body;
                if (date_of_birth) userData.dateOfBirth = new Date(date_of_birth);
                if (address) {
                    userData.address = {
                        city: address.city,
                        street: address.area || address.address_line,
                        state: address.area
                    };
                }
                if (license_number) {
                    userData.driverInfo = {
                        licenseNumber: license_number,
                        isVerified: false
                    };
                }
            }

            const user = new User(userData);
            await user.save();

            // Create driver details if driver
            if (user_type === 'driver') {
                const driverDetail = new DriverDetail({
                    user: user._id,
                    services: ['ride'],
                    verificationStatus: 'pending'
                });
                await driverDetail.save();
            }

            // Build response
            const responseData = {
                user_id: user._id,
                phone: user.phone,
                otp_expires_in: 300,
                requires_verification: true
            };

            if (user_type === 'driver') {
                responseData.next_step = 'vehicle_registration';
            }

            // TODO: Send OTP via Afro SMS. For now OTP is always 123456.
            console.log(`[OTP] Registration OTP for ${phone}: ${userData.otp}`);

            res.status(201).json({
                success: true,
                message: 'OTP sent to your phone',
                data: responseData
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'REGISTRATION_FAILED',
                    message: 'Registration failed. Please try again.'
                }
            });
        }
    }

    // 2. POST /auth/login - Login user
    static async login(req, res) {
        try {
            const { phone, password, device_info } = req.body;

            if (!phone || !password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_CREDENTIALS',
                        message: 'Phone number and password are required'
                    }
                });
            }

            // Find user by phone with password
            const user = await User.findOne({ phone }).select('+password');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Phone number or password is incorrect'
                    }
                });
            }

            // Check if account is suspended
            if (user.status === 'suspended') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ACCOUNT_SUSPENDED',
                        message: 'Your account has been suspended. Contact support.'
                    }
                });
            }

            // Check if account is verified
            if (!user.isActive && user.status === 'pending') {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNVERIFIED_ACCOUNT',
                        message: 'Please verify your phone number first'
                    },
                    data: {
                        requires_verification: true,
                        phone: user.phone
                    }
                });
            }

            // Check if account is locked
            if (user.lockUntil && user.lockUntil > Date.now()) {
                return res.status(423).json({
                    success: false,
                    error: {
                        code: 'ACCOUNT_LOCKED',
                        message: 'Account temporarily locked due to multiple failed attempts. Try again later.'
                    }
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                // Increment failed attempts
                user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
                if (user.failedLoginAttempts >= 5) {
                    user.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
                }
                await user.save();

                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Phone number or password is incorrect'
                    }
                });
            }

            // Reset failed attempts on success
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
            user.lastLoginAt = new Date();

            // Update device info
            if (device_info) {
                user.deviceInfo = {
                    device_id: device_info.device_id,
                    device_type: device_info.device_type || 'android',
                    fcm_token: device_info.fcm_token
                };
                if (device_info.fcm_token) {
                    user.fcmToken = device_info.fcm_token;
                }
            }
            await user.save();

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            // Store refresh token
            user.refreshToken = refreshToken;
            await user.save();

            // Build response
            const userType = mapUserType(user);
            const userResponse = {
                id: user._id,
                full_name: `${user.firstName} ${user.lastName}`.trim(),
                phone: user.phone,
                user_type: userType,
                photo: user.profileImage || null,
                status: user.status || 'active',
                created_at: user.createdAt
            };

            const responseData = {
                user: userResponse,
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: 3600,
                    token_type: 'Bearer'
                }
            };

            // Add driver-specific data
            if (user.userType === 'driver') {
                const driverDetail = await DriverDetail.findOne({ user: user._id });
                userResponse.rating = driverDetail?.averageRating || 0;
                userResponse.total_rides = driverDetail?.rideCount || 0;
                userResponse.is_online = driverDetail?.isOnline || false;

                responseData.vehicle = driverDetail?.currentVehicle ? {
                    id: driverDetail.currentVehicle,
                    type: 'Bajaj',
                    plate: '3-12345',
                    color: 'Blue'
                } : null;
                responseData.assigned_groups = 0;
                responseData.today_rides = 0;
                responseData.pending_earnings = 0;
            }

            // Add parent-specific data
            if (userType === 'parent') {
                responseData.children_count = 0; // TODO: count from ParentChildRelationship
                responseData.active_subscriptions = 0;
                responseData.has_pending_payments = false;
            }

            res.json({
                success: true,
                message: 'Login successful',
                data: responseData
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'LOGIN_FAILED',
                    message: 'Login failed. Please try again.'
                }
            });
        }
    }

    // 3. POST /auth/logout - Logout user
    static async logout(req, res) {
        try {
            const { device_id, logout_all_devices } = req.body;
            const user = req.user;

            if (user) {
                if (logout_all_devices) {
                    user.refreshToken = null;
                    user.fcmToken = null;
                    user.deviceInfo = {};
                } else {
                    // Clear current device token
                    if (device_id && user.deviceInfo?.device_id === device_id) {
                        user.deviceInfo = {};
                        user.fcmToken = null;
                    }
                    user.refreshToken = null;
                }
                await user.save();
            }

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'LOGOUT_FAILED',
                    message: 'Logout failed. Please try again.'
                }
            });
        }
    }

    // 4. POST /auth/forgot-password - Request Password Reset
    static async forgotPassword(req, res) {
        try {
            const { phone } = req.body;

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_PHONE',
                        message: 'Phone number is required'
                    }
                });
            }

            const user = await User.findOne({ phone });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'PHONE_NOT_FOUND',
                        message: 'No account found with this phone number'
                    }
                });
            }

            // Generate and save OTP
            const otp = generateOTP();
            user.otp = otp;
            user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
            user.otpPurpose = 'password_reset';
            user.otpAttempts = 0;
            user.lastOTPSent = new Date();
            await user.save();

            // TODO: Send OTP via Afro SMS
            console.log(`[OTP] Password reset OTP for ${phone}: ${otp}`);

            res.json({
                success: true,
                message: 'OTP sent to your phone',
                data: {
                    phone: user.phone,
                    otp_expires_in: 300,
                    masked_phone: generatePhoneMask(user.phone)
                }
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FAILED_TO_SEND_OTP',
                    message: 'Failed to send OTP. Please try again.'
                }
            });
        }
    }

    // 5. POST /auth/reset-password - Reset Password
    static async resetPassword(req, res) {
        try {
            const { phone, otp, new_password, confirm_password } = req.body;

            if (!phone || !otp || !new_password || !confirm_password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'All fields are required'
                    }
                });
            }

            if (new_password !== confirm_password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PASSWORD_MISMATCH',
                        message: 'Passwords do not match'
                    }
                });
            }

            if (new_password.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'WEAK_PASSWORD',
                        message: 'Password must be at least 8 characters with numbers and letters'
                    }
                });
            }

            const user = await User.findOne({ phone }).select('+password');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'PHONE_NOT_FOUND',
                        message: 'No account found with this phone number'
                    }
                });
            }

            // Verify OTP
            if (!verifyOTP(user.otp, otp) || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_OTP',
                        message: 'OTP is invalid or expired'
                    }
                });
            }

            // Update password (pre-save hook will hash it)
            user.password = new_password;
            user.otp = null;
            user.otpExpiresAt = null;
            user.otpPurpose = null;
            user.otpAttempts = 0;
            await user.save();

            res.json({
                success: true,
                message: 'Password reset successful. Please login with your new password.'
            });

        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'RESET_FAILED',
                    message: 'Failed to reset password. Please try again.'
                }
            });
        }
    }

    // 6. POST /auth/verify-otp - Verify OTP Code
    static async verifyOTP(req, res) {
        try {
            const { phone, otp, purpose } = req.body;

            if (!phone || !otp) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'Phone number and OTP are required'
                    }
                });
            }

            const user = await User.findOne({ phone });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }

            // Check OTP validity
            if (!verifyOTP(user.otp, otp) || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
                user.otpAttempts = (user.otpAttempts || 0) + 1;

                if (user.otpAttempts >= 3) {
                    user.otp = null;
                    user.otpExpiresAt = null;
                    await user.save();

                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'TOO_MANY_ATTEMPTS',
                            message: 'Too many failed attempts. Please request a new OTP.'
                        }
                    });
                }

                await user.save();

                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_OTP',
                        message: 'OTP is invalid or expired'
                    },
                    data: {
                        attempts_remaining: 3 - user.otpAttempts
                    }
                });
            }

            // Clear OTP and activate user
            user.otp = null;
            user.otpExpiresAt = null;
            user.otpAttempts = 0;
            user.isActive = true;
            user.status = 'active';
            user.isPhoneVerified = true;
            user.phoneVerifiedAt = new Date();
            user.verifiedAt = new Date();
            await user.save();

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            // Store refresh token
            user.refreshToken = refreshToken;
            await user.save();

            // Build response
            const userType = mapUserType(user);
            const userResponse = {
                id: user._id,
                full_name: `${user.firstName} ${user.lastName}`.trim(),
                phone: user.phone,
                user_type: userType,
                status: user.status
            };

            const responseData = {
                user: userResponse,
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: 3600,
                    token_type: 'Bearer'
                }
            };

            // Add next step based on user type
            if (purpose === 'registration' || user.verifiedAt) {
                if (userType === 'parent') {
                    responseData.next_step = 'add_child';
                } else if (userType === 'driver') {
                    responseData.next_step = 'vehicle_registration';
                    userResponse.status = 'pending';
                }
            }

            res.json({
                success: true,
                message: 'Phone verified successfully',
                data: responseData
            });

        } catch (error) {
            console.error('OTP verification error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'VERIFICATION_FAILED',
                    message: 'Failed to verify OTP. Please try again.'
                }
            });
        }
    }

    // 7. POST /auth/refresh-token - Refresh Access Token
    static async refreshToken(req, res) {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_REFRESH_TOKEN',
                        message: 'Refresh token is required'
                    }
                });
            }

            // Verify refresh token
            let decoded;
            try {
                decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret');
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_REFRESH_TOKEN',
                        message: 'Refresh token is invalid or expired. Please login again.'
                    }
                });
            }

            const user = await User.findById(decoded.id);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_REFRESH_TOKEN',
                        message: 'Refresh token is invalid or expired. Please login again.'
                    }
                });
            }

            // Generate new tokens
            const newAccessToken = generateAccessToken(user);
            const newRefreshToken = generateRefreshToken(user);

            // Store new refresh token
            user.refreshToken = newRefreshToken;
            await user.save();

            res.json({
                success: true,
                data: {
                    access_token: newAccessToken,
                    refresh_token: newRefreshToken,
                    expires_in: 3600,
                    token_type: 'Bearer'
                }
            });

        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Refresh token is invalid or expired. Please login again.'
                }
            });
        }
    }

    // 8. GET /auth/me - Get Current User
    static async getCurrentUser(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Invalid or expired token'
                    }
                });
            }

            const userType = mapUserType(user);
            const userResponse = {
                id: user._id,
                full_name: `${user.firstName} ${user.lastName}`.trim(),
                phone: user.phone,
                user_type: userType,
                photo: user.profileImage || null,
                status: user.status || 'active',
                created_at: user.createdAt,
                updated_at: user.updatedAt
            };

            const responseData = {
                user: userResponse,
                summary: {}
            };

            if (user.userType === 'driver') {
                const driverDetail = await DriverDetail.findOne({ user: user._id });
                userResponse.date_of_birth = user.dateOfBirth;
                userResponse.license_number = user.driverInfo?.licenseNumber;
                userResponse.address = user.address;
                userResponse.is_online = driverDetail?.isOnline || false;
                userResponse.rating = driverDetail?.averageRating || 0;
                userResponse.total_rides = driverDetail?.rideCount || 0;

                responseData.vehicle = driverDetail?.currentVehicle ? {
                    id: driverDetail.currentVehicle,
                    type: 'Bajaj',
                    plate: '3-12345',
                    color: 'Blue',
                    capacity: 8,
                    photo: null
                } : null;

                responseData.documents = {
                    license: { status: user.driverInfo?.isVerified ? 'verified' : 'pending', expires_at: user.driverInfo?.licenseExpiry },
                    id_card: { status: 'pending' },
                    vehicle_registration: { status: 'pending' }
                };

                responseData.summary = {
                    assigned_groups: 0,
                    total_students: 0,
                    today_rides: 0,
                    today_earnings: 0,
                    pending_earnings: driverDetail?.totalEarnings || 0,
                    total_earnings: driverDetail?.totalEarnings || 0
                };
            } else if (userType === 'parent') {
                responseData.summary = {
                    children_count: 0, // TODO: count from ParentChildRelationship
                    active_subscriptions: 0,
                    active_packages: 0,
                    pending_payments: 0,
                    total_rides: 0
                };
            }

            res.json({
                success: true,
                data: responseData
            });

        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'FAILED_TO_GET_USER',
                    message: 'Failed to get user information'
                }
            });
        }
    }

    // 9. POST /auth/resend-otp - Resend OTP
    static async resendOTP(req, res) {
        try {
            const { phone, purpose } = req.body;

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_PHONE',
                        message: 'Phone number is required'
                    }
                });
            }

            const user = await User.findOne({ phone });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: 'User not found'
                    }
                });
            }

            // Rate limiting
            const now = new Date();
            const lastOTPSent = user.lastOTPSent || new Date(0);
            const timeSinceLastOTP = now - lastOTPSent;

            if (timeSinceLastOTP < 60000) {
                return res.status(429).json({
                    success: false,
                    error: {
                        code: 'RESEND_TOO_SOON',
                        message: 'Please wait before requesting another OTP'
                    },
                    data: {
                        resend_available_in: Math.ceil((60000 - timeSinceLastOTP) / 1000)
                    }
                });
            }

            // Generate new OTP
            const otp = generateOTP();
            user.otp = otp;
            user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
            user.otpPurpose = purpose || 'registration';
            user.otpAttempts = 0;
            user.lastOTPSent = now;
            await user.save();

            // TODO: Send OTP via Afro SMS
            console.log(`[OTP] Resend OTP for ${phone}: ${otp}`);

            res.json({
                success: true,
                message: 'OTP resent successfully',
                data: {
                    otp_expires_in: 300,
                    resend_available_in: 60
                }
            });

        } catch (error) {
            console.error('Resend OTP error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'RESEND_FAILED',
                    message: 'Failed to resend OTP'
                }
            });
        }
    }

    // 10. POST /auth/change-password - Change Password (Logged In)
    static async changePassword(req, res) {
        try {
            const { current_password, new_password, confirm_password } = req.body;

            if (!current_password || !new_password || !confirm_password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_FIELDS',
                        message: 'All fields are required'
                    }
                });
            }

            if (new_password !== confirm_password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PASSWORD_MISMATCH',
                        message: 'Passwords do not match'
                    }
                });
            }

            if (new_password.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'WEAK_PASSWORD',
                        message: 'Password must be at least 8 characters with numbers and letters'
                    }
                });
            }

            // Get user with password field
            const user = await User.findById(req.user._id).select('+password');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not found'
                    }
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'WRONG_PASSWORD',
                        message: 'Current password is incorrect'
                    }
                });
            }

            // Update password (pre-save hook will hash it)
            user.password = new_password;
            await user.save();

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'CHANGE_PASSWORD_FAILED',
                    message: 'Failed to change password'
                }
            });
        }
    }

    // 11. DELETE /auth/account - Delete Account
    static async deleteAccount(req, res) {
        try {
            const { password, reason, feedback } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_PASSWORD',
                        message: 'Password is required to delete account'
                    }
                });
            }

            // Get user with password field
            const user = await User.findById(req.user._id).select('+password');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'User not found'
                    }
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PASSWORD',
                        message: 'Invalid password'
                    }
                });
            }

            // Schedule deletion (soft delete with 30-day grace period)
            user.status = 'deleted';
            user.deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            user.deletionReason = reason;
            user.deletionFeedback = feedback;
            user.isActive = false;
            user.refreshToken = null;
            await user.save();

            res.json({
                success: true,
                message: 'Account deletion scheduled. Your data will be deleted within 30 days.',
                data: {
                    deletion_date: user.deletionDate,
                    can_recover_until: user.deletionDate
                }
            });

        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'DELETION_FAILED',
                    message: 'Failed to schedule account deletion'
                }
            });
        }
    }
}

module.exports = ApiAuthController;
