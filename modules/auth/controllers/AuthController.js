const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthController {
    // Login method
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find user by credentials
            const user = await User.findByCredentials(email, password);

            // Generate JWT token
            const token = user.generateAuthToken();

            // Prepare user data for response (exclude sensitive info)
            const userData = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                userType: user.userType,
                status: user.status,
                profileImage: user.profileImage,
                lastLogin: user.lastLogin,
                emailVerified: user.emailVerified
            };

            // Set HTTP-only cookie with token
            res.cookie('adminAuth', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/'
            });

            // Log successful login
            console.log(`User logged in: ${email} (${user.role}) at ${new Date().toISOString()}`);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userData,
                    token: token
                }
            });

        } catch (error) {
            console.error('Login error:', error.message);
            
            // Return appropriate error message
            let statusCode = 500;
            let message = 'Login failed';

            if (error.message.includes('Invalid credentials')) {
                statusCode = 401;
                message = 'Invalid email or password';
            } else if (error.message.includes('Account is temporarily locked')) {
                statusCode = 423;
                message = 'Account temporarily locked due to multiple failed attempts. Please try again later.';
            } else if (error.message.includes('Account is not active')) {
                statusCode = 403;
                message = 'Account is not active. Please contact administrator.';
            }

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    // Logout method
    static async logout(req, res) {
        try {
            // Clear the authentication cookie
            res.clearCookie('adminAuth', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            // Log logout
            console.log(`User logged out at ${new Date().toISOString()}`);

            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            console.error('Logout error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }

    // Get current user profile
    static async getProfile(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            // Prepare user data for response
            const userData = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                userType: user.userType,
                status: user.status,
                profileImage: user.profileImage,
                lastLogin: user.lastLogin,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            res.json({
                success: true,
                data: {
                    user: userData
                }
            });

        } catch (error) {
            console.error('Get profile error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to get user profile'
            });
        }
    }

    // Update profile
    static async updateProfile(req, res) {
        try {
            const user = req.user;
            const { firstName, lastName, phone, profileImage } = req.body;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            // Update allowed fields
            const updateData = {};
            if (firstName) updateData.firstName = firstName;
            if (lastName) updateData.lastName = lastName;
            if (phone !== undefined) updateData.phone = phone;
            if (profileImage !== undefined) updateData.profileImage = profileImage;

            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                updateData,
                { new: true, runValidators: true }
            );

            // Prepare updated user data for response
            const userData = {
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                userType: updatedUser.userType,
                status: updatedUser.status,
                profileImage: updatedUser.profileImage,
                lastLogin: updatedUser.lastLogin,
                emailVerified: updatedUser.emailVerified,
                updatedAt: updatedUser.updatedAt
            };

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: userData
                }
            });

        } catch (error) {
            console.error('Update profile error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    }

    // Change password
    static async changePassword(req, res) {
        try {
            const user = req.user;
            const { currentPassword, newPassword } = req.body;

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters long'
                });
            }

            // Get user with password
            const userWithPassword = await User.findById(user._id).select('+password');

            // Verify current password
            const isCurrentPasswordValid = await userWithPassword.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            userWithPassword.password = newPassword;
            await userWithPassword.save();

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to change password'
            });
        }
    }

    // Forgot password
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

            // Set reset token and expiry (1 hour)
            user.passwordResetToken = resetTokenHash;
            user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
            await user.save();

            // In a real application, send email with reset token
            console.log(`Password reset token for ${email}: ${resetToken}`);

            res.json({
                success: true,
                message: 'Password reset instructions sent to your email',
                // In development, return the token for testing
                ...(process.env.NODE_ENV !== 'production' && { resetToken })
            });

        } catch (error) {
            console.error('Forgot password error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to process password reset request'
            });
        }
    }

    // Reset password
    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Reset token and new password are required'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters long'
                });
            }

            // Hash the token to compare with stored token
            const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

            // Find user with valid reset token
            const user = await User.findOne({
                passwordResetToken: resetTokenHash,
                passwordResetExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired reset token'
                });
            }

            // Update password and clear reset fields
            user.password = newPassword;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error) {
            console.error('Reset password error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password'
            });
        }
    }

    // Check authentication status
    static async checkAuth(req, res) {
        try {
            const user = req.user;

            if (!user) {
                return res.json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            res.json({
                success: true,
                message: 'Authenticated',
                data: {
                    user: {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        userType: user.userType
                    }
                }
            });

        } catch (error) {
            console.error('Check auth error:', error.message);
            res.json({
                success: false,
                message: 'Failed to check authentication status'
            });
        }
    }
}

module.exports = AuthController;
