const User = require('../models/User');
const DriverDetail = require('../../user-management/models/DriverDetail');
const { generateOTP, formatOTPExpiry } = require('../utils/otpUtils');

class AdminAuthController {
    // Get authentication statistics
    static async getAuthStats(req, res) {
        try {
            const stats = {
                totalRegistrations: await User.countDocuments(),
                pendingVerifications: await User.countDocuments({ isActive: false }),
                activeSessions: await User.countDocuments({ lastLoginAt: { $exists: true } }),
                todayLogins: await User.countDocuments({
                    lastLoginAt: {
                        $gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }),
                registrationsByType: await User.aggregate([
                    {
                        $group: {
                            _id: '$userType',
                            count: { $sum: 1 }
                        }
                    }
                ]),
                registrationsByStatus: await User.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get auth stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch authentication statistics'
            });
        }
    }

    // Get pending verifications
    static async getPendingVerifications(req, res) {
        try {
            const { page = 1, limit = 10, userType, search } = req.query;
            
            const query = { isActive: false };
            
            if (userType) {
                query.userType = userType;
            }
            
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            const users = await User.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await User.countDocuments(query);

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        current: parseInt(page),
                        pageSize: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get pending verifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch pending verifications'
            });
        }
    }

    // Get active sessions
    static async getActiveSessions(req, res) {
        try {
            const { page = 1, limit = 10, search } = req.query;
            
            const query = { 
                lastLoginAt: { $exists: true },
                isActive: true 
            };
            
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            const users = await User.find(query)
                .sort({ lastLoginAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await User.countDocuments(query);

            res.json({
                success: true,
                data: {
                    users,
                    pagination: {
                        current: parseInt(page),
                        pageSize: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Get active sessions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch active sessions'
            });
        }
    }

    // Get authentication timeline
    static async getAuthTimeline(req, res) {
        try {
            const { limit = 50, userType, dateRange } = req.query;
            
            // Build date filter
            let dateFilter = {};
            if (dateRange === 'today') {
                dateFilter = {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                };
            } else if (dateRange === 'week') {
                dateFilter = {
                    $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                };
            } else if (dateRange === 'month') {
                dateFilter = {
                    $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                };
            }

            const query = {};
            if (dateFilter) {
                query.createdAt = dateFilter;
            }
            
            if (userType) {
                query.userType = userType;
            }

            const users = await User.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit));

            // Create timeline events
            const timeline = users.map(user => {
                const events = [];
                
                // Registration event
                events.push({
                    id: `reg_${user._id}`,
                    type: 'registration',
                    user: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone
                    },
                    action: 'New user registration',
                    status: user.isActive ? 'success' : 'pending',
                    timestamp: user.createdAt,
                    details: `User registered as ${user.userType}, ${user.isActive ? 'verified' : 'OTP sent to phone'}`
                });

                // Login event
                if (user.lastLoginAt) {
                    events.push({
                        id: `login_${user._id}`,
                        type: 'login',
                        user: {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            phone: user.phone
                        },
                        action: 'User login',
                        status: 'success',
                        timestamp: user.lastLoginAt,
                        details: `${user.userType} logged in from ${user.deviceInfo?.device_type || 'unknown device'}`
                    });
                }

                return events;
            }).flat();

            // Sort by timestamp
            timeline.sort((a, b) => b.timestamp - a.timestamp);

            res.json({
                success: true,
                data: {
                    timeline: timeline.slice(0, parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Get auth timeline error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch authentication timeline'
            });
        }
    }

    // Generate manual OTP
    static async generateManualOTP(req, res) {
        try {
            const { phone, purpose, expiryMinutes = 5 } = req.body;

            if (!phone || !purpose) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number and purpose are required'
                });
            }

            // Find user by phone
            const user = await User.findOne({ phone });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found with this phone number'
                });
            }

            // Generate OTP
            const otp = generateOTP();
            user.otp = otp;
            user.otpExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
            user.otpPurpose = purpose;
            user.otpGeneratedAt = new Date();
            await user.save();

            res.json({
                success: true,
                message: 'OTP generated successfully',
                data: {
                    otp,
                    phone: user.phone,
                    purpose,
                    expiresAt: user.otpExpiresAt,
                    expiresIn: expiryMinutes * 60
                }
            });
        } catch (error) {
            console.error('Generate manual OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate OTP'
            });
        }
    }

    // Approve verification
    static async approveVerification(req, res) {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Activate user
            user.isActive = true;
            user.verifiedAt = new Date();
            user.otp = null;
            user.otpExpiresAt = null;
            user.otpPurpose = null;
            await user.save();

            res.json({
                success: true,
                message: 'User verification approved successfully',
                data: {
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        userType: user.userType,
                        status: 'active'
                    }
                }
            });
        } catch (error) {
            console.error('Approve verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to approve verification'
            });
        }
    }

    // Reject verification
    static async rejectVerification(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Delete user (or mark as rejected)
            await User.findByIdAndDelete(userId);

            res.json({
                success: true,
                message: 'User verification rejected successfully'
            });
        } catch (error) {
            console.error('Reject verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reject verification'
            });
        }
    }

    // Resend OTP
    static async resendOTP(req, res) {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Check if can resend (rate limiting)
            const now = new Date();
            const lastOTPSent = user.otpGeneratedAt || new Date(0);
            const timeSinceLastOTP = now - lastOTPSent;

            if (timeSinceLastOTP < 60000) { // 1 minute
                return res.status(429).json({
                    success: false,
                    message: 'Please wait before requesting another OTP',
                    data: {
                        resendAvailableIn: Math.ceil((60000 - timeSinceLastOTP) / 1000)
                    }
                });
            }

            // Generate new OTP
            const otp = generateOTP();
            user.otp = otp;
            user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
            user.otpGeneratedAt = now;
            await user.save();

            res.json({
                success: true,
                message: 'OTP resent successfully',
                data: {
                    otp,
                    phone: user.phone,
                    expiresAt: user.otpExpiresAt,
                    expiresIn: 300
                }
            });
        } catch (error) {
            console.error('Resend OTP error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to resend OTP'
            });
        }
    }

    // Terminate session
    static async terminateSession(req, res) {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Clear session data
            user.lastLoginAt = null;
            user.deviceInfo = null;
            await user.save();

            res.json({
                success: true,
                message: 'Session terminated successfully'
            });
        } catch (error) {
            console.error('Terminate session error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to terminate session'
            });
        }
    }

    // Get user authentication details
    static async getUserAuthDetails(req, res) {
        try {
            const { userId } = req.params;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            let driverDetail = null;
            if (user.userType === 'driver') {
                driverDetail = await DriverDetail.findOne({ user: user._id });
            }

            const authDetails = {
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    email: user.email,
                    userType: user.userType,
                    status: user.status,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    verifiedAt: user.verifiedAt
                },
                authentication: {
                    hasOTP: !!user.otp,
                    otpExpiresAt: user.otpExpiresAt,
                    otpPurpose: user.otpPurpose,
                    otpGeneratedAt: user.otpGeneratedAt,
                    deviceInfo: user.deviceInfo
                },
                driverDetail: driverDetail ? {
                    isOnline: driverDetail.isOnline,
                    availabilityStatus: driverDetail.availabilityStatus,
                    verificationStatus: driverDetail.verificationStatus,
                    averageRating: driverDetail.averageRating,
                    totalRatings: driverDetail.totalRatings
                } : null
            };

            res.json({
                success: true,
                data: authDetails
            });
        } catch (error) {
            console.error('Get user auth details error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user authentication details'
            });
        }
    }

    // Bulk operations
    static async bulkApproveVerifications(req, res) {
        try {
            const { userIds } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required'
                });
            }

            const result = await User.updateMany(
                { _id: { $in: userIds } },
                { 
                    isActive: true,
                    verifiedAt: new Date(),
                    otp: null,
                    otpExpiresAt: null,
                    otpPurpose: null
                }
            );

            res.json({
                success: true,
                message: `${result.modifiedCount} users approved successfully`,
                data: {
                    approvedCount: result.modifiedCount
                }
            });
        } catch (error) {
            console.error('Bulk approve verifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to bulk approve verifications'
            });
        }
    }

    static async bulkRejectVerifications(req, res) {
        try {
            const { userIds } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required'
                });
            }

            const result = await User.deleteMany({ _id: { $in: userIds } });

            res.json({
                success: true,
                message: `${result.deletedCount} users rejected successfully`,
                data: {
                    rejectedCount: result.deletedCount
                }
            });
        } catch (error) {
            console.error('Bulk reject verifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to bulk reject verifications'
            });
        }
    }

    static async bulkTerminateSessions(req, res) {
        try {
            const { userIds } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required'
                });
            }

            const result = await User.updateMany(
                { _id: { $in: userIds } },
                { 
                    lastLoginAt: null,
                    deviceInfo: null
                }
            );

            res.json({
                success: true,
                message: `${result.modifiedCount} sessions terminated successfully`,
                data: {
                    terminatedCount: result.modifiedCount
                }
            });
        } catch (error) {
            console.error('Bulk terminate sessions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to bulk terminate sessions'
            });
        }
    }
}

module.exports = AdminAuthController;
