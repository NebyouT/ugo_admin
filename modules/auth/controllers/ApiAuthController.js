const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DriverDetail = require('../../user-management/models/DriverDetail');
const { generateOTP, verifyOTP, generatePhoneMask } = require('../utils/otpUtils');

class ApiAuthController {
    // Register new user
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

            // Password validation
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'WEAK_PASSWORD',
                        message: 'Password must be at least 8 characters long'
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

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user based on type
            let userData = {
                user_type,
                firstName: full_name.split(' ')[0] || full_name,
                lastName: full_name.split(' ').slice(1).join(' ') || '',
                phone,
                password: hashedPassword,
                isActive: false, // Requires OTP verification
                deviceInfo,
                otp: generateOTP(),
                otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Add driver-specific fields
            if (user_type === 'driver') {
                const { date_of_birth, address, license_number } = req.body;
                userData.dateOfBirth = date_of_birth ? new Date(date_of_birth) : null;
                userData.address = address || {};
                userData.driverInfo = {
                    licenseNumber: license_number,
                    isVerified: false
                };
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

            // Generate response data
            const responseData = {
                user_id: user._id,
                phone: user.phone,
                otp_expires_in: 300,
                requires_verification: true
            };

            if (user_type === 'driver') {
                responseData.next_step = 'vehicle_registration';
            }

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

    // Login user
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

            // Find user by phone
            const user = await User.findOne({ phone });
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
            if (!user.isActive) {
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

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        message: 'Phone number or password is incorrect'
                    }
                });
            }

            // Update last login and device info
            user.lastLoginAt = new Date();
            user.deviceInfo = device_info;
            await user.save();

            // Generate tokens
            const accessToken = jwt.sign(
                { id: user._id, phone: user.phone, userType: user.user_type },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { id: user._id, phone: user.phone },
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
                { expiresIn: '7d' }
            );

            // Prepare user data for response
            const userResponse = {
                id: user._id,
                full_name: `${user.firstName} ${user.lastName}`,
                phone: user.phone,
                user_type: user.user_type,
                photo: user.profileImage || null,
                status: user.status,
                created_at: user.createdAt
            };

            // Add driver-specific data
            if (user.user_type === 'driver') {
                const driverDetail = await DriverDetail.findOne({ user: user._id });
                userResponse.rating = driverDetail?.averageRating || 0;
                userResponse.total_rides = driverDetail?.rideCount || 0;
                userResponse.is_online = driverDetail?.isOnline || false;
                userResponse.date_of_birth = user.dateOfBirth;
                userResponse.license_number = user.driverInfo?.licenseNumber;
                userResponse.address = user.address;
            }

            // Add parent-specific data
            if (user.user_type === 'parent') {
                userResponse.children_count = 2; // TODO: Get from database
                userResponse.active_subscriptions = 1;
                userResponse.has_pending_payments = false;
            }

            const responseData = {
                user: userResponse,
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    expires_in: 3600,
                    token_type: 'Bearer'
                }
            };

            // Add additional data based on user type
            if (user.user_type === 'driver') {
                responseData.assigned_groups = 2;
                responseData.today_rides = 8;
                responseData.pending_earnings = 850;
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

    // Logout user
    static async logout(req, res) {
        try {
            const { device_id, logout_all_devices } = req.body;
            
            // In a real implementation, you would:
            // 1. Invalidate the specific device token
            // 2. If logout_all_devices, invalidate all tokens for the user
            // 3. Update user's device status
            
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

    // Request password reset
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
            await user.save();

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

    // Reset password
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

            // Password validation
            if (new_password.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'WEAK_PASSWORD',
                        message: 'Password must be at least 8 characters long'
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

            // Verify OTP
            if (!verifyOTP(user.otp, otp) || user.otpExpiresAt < new Date()) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_OTP',
                        message: 'OTP is invalid or expired'
                    }
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 12);
            user.password = hashedPassword;
            user.otp = null;
            user.otpExpiresAt = null;
            user.otpPurpose = null;
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

    // Verify OTP
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
            if (!verifyOTP(user.otp, otp) || user.otpExpiresAt < new Date()) {
                // Decrease attempts
                user.otpAttempts = (user.otpAttempts || 0) + 1;
                
                if (user.otpAttempts >= 3) {
                    // Clear OTP and require new one
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
            user.verifiedAt = new Date();
            await user.save();

            // Generate tokens
            const accessToken = jwt.sign(
                { id: user._id, phone: user.phone, userType: user.user_type },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { id: user._id, phone: user.phone },
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
                { expiresIn: '7d' }
            );

            // Prepare user data
            const userResponse = {
                id: user._id,
                full_name: `${user.firstName} ${user.lastName}`,
                phone: user.phone,
                user_type: user.user_type,
                status: user.status,
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

            // Add next step based on user type and purpose
            if (purpose === 'registration') {
                if (user.user_type === 'parent') {
                    responseData.next_step = 'add_child';
                } else if (user.user_type === 'driver') {
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

    // Refresh token
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
            const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret');
            
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_REFRESH_TOKEN',
                        message: 'Refresh token is invalid or expired. Please login again.'
                    }
                });
            }

            // Generate new tokens
            const newAccessToken = jwt.sign(
                { id: user._id, phone: user.phone, userType: user.user_type },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );

            const newRefreshToken = jwt.sign(
                { id: user._id, phone: user.phone },
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
                { expiresIn: '7d' }
            );

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

    // Get current user
    static async getCurrentUser(req, res) {
        try {
            const user = req.user; // Assuming middleware sets this

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Invalid or expired token'
                    }
                });
            }

            // Prepare user data
            const userResponse = {
                id: user._id,
                full_name: `${user.firstName} ${user.lastName}`,
                phone: user.phone,
                user_type: user.user_type,
                photo: user.profileImage || null,
                status: user.status,
                created_at: user.createdAt,
                updated_at: user.updatedAt
            };

            // Add driver-specific data
            if (user.user_type === 'driver') {
                const driverDetail = await DriverDetail.findOne({ user: user._id });
                userResponse.date_of_birth = user.dateOfBirth;
                userResponse.license_number = user.driverInfo?.licenseNumber;
                userResponse.address = user.address;
                userResponse.is_online = driverDetail?.isOnline || false;
                userResponse.rating = driverDetail?.averageRating || 0;
                userResponse.total_rides = driverDetail?.rideCount || 0;
                userResponse.created_at = user.createdAt;
                userResponse.updated_at = user.updatedAt;
            }

            const responseData = {
                user: userResponse,
                summary: {}
            };

            // Add summary data based on user type
            if (user.user_type === 'parent') {
                responseData.summary = {
                    children_count: 2,
                    active_subscriptions: 1,
                    active_packages: 1,
                    pending_payments: 0,
                    total_rides: 45
                };
            } else if (user.user_type === 'driver') {
                const driverDetail = await DriverDetail.findOne({ user: user._id });
                responseData.vehicle = {
                    id: 'vehicle_001',
                    type: 'Bajaj',
                    plate: '3-12345',
                    color: 'Blue',
                    capacity: 8
                };
                responseData.documents = {
                    license: {
                        status: 'verified',
                        expires_at: '2028-05-15'
                    },
                    id_card: {
                        status: 'verified'
                    },
                    vehicle_registration: {
                        status: 'verified'
                    }
                };
                responseData.summary = {
                    assigned_groups: 2,
                    total_students: 14,
                    today_rides: 8,
                    today_earnings: 850,
                    pending_earnings: 12500,
                    total_earnings: 85000
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

    // Resend OTP
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

            // Check if can resend (rate limiting)
            const now = new Date();
            const lastOTPSent = user.lastOTPSent || new Date(0);
            const timeSinceLastOTP = now - lastOTPSent;

            if (timeSinceLastOTP < 60000) { // 1 minute
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
            user.otpPurpose = purpose || 'verification';
            user.lastOTPSent = now;
            await user.save();

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

    // Change password (logged in user)
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
                        message: 'Password must be at least 8 characters long'
                    }
                });
            }

            const user = req.user;
            
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

            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 12);
            user.password = hashedPassword;
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

    // Delete account
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

            const user = req.user;
            
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

            // Schedule deletion (soft delete with deletion date)
            user.status = 'deleted';
            user.deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            user.deletionReason = reason;
            user.deletionFeedback = feedback;
            user.isActive = false;
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
