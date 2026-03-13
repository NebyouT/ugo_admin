const User = require('../../user-management/models/User');
const { generateOTP } = require('../utils/otpUtils');

class ProfileController {
  // PUT /users/profile - Update Profile
  static async updateProfile(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
        });
      }

      const { full_name, date_of_birth, address, photo } = req.body;

      // Validate name
      if (full_name) {
        const nameParts = full_name.trim().split(/\s+/);
        if (nameParts.length < 2) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_NAME', message: 'Name must contain at least 2 words' }
          });
        }
        user.firstName = nameParts[0];
        user.lastName = nameParts.slice(1).join(' ');
      }

      if (date_of_birth) user.dateOfBirth = date_of_birth;
      if (photo) user.profileImage = photo;

      if (address && typeof address === 'object') {
        user.address = `${address.city || ''}, ${address.area || ''}`.trim().replace(/^,|,$/g, '');
      } else if (typeof address === 'string') {
        user.address = address;
      }

      await user.save();

      const responseUser = {
        id: user._id,
        full_name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        user_type: user.userType,
        photo: user.profileImage,
        status: user.isActive ? 'active' : 'inactive',
        updated_at: user.updatedAt
      };

      // Add driver-specific fields
      if (user.userType === 'driver') {
        responseUser.date_of_birth = user.dateOfBirth;
        responseUser.address = user.address;
        responseUser.license_number = user.driverInfo?.licenseNumber;
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: responseUser }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update profile' }
      });
    }
  }

  // POST /users/phone/change - Request Phone Change
  static async requestPhoneChange(req, res) {
    try {
      const { new_phone, password } = req.body;

      if (!new_phone || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'New phone and password are required' }
        });
      }

      // Verify password (password has select:false, so must explicitly select it)
      const user = await User.findById(req.user._id).select('+password');
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: { code: 'WRONG_PASSWORD', message: 'Password is incorrect' }
        });
      }

      // Check if phone exists
      const existingUser = await User.findOne({ phone: new_phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: { code: 'PHONE_EXISTS', message: 'This phone number is already registered' }
        });
      }

      // Generate OTP and store it
      const otpCode = generateOTP();
      user.phoneChangeOTP = otpCode;
      user.phoneChangeOTPExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min
      user.pendingPhone = new_phone;
      await user.save();

      res.json({
        success: true,
        message: 'OTP sent to new phone number',
        data: {
          new_phone: new_phone,
          otp_expires_in: 300
        }
      });
    } catch (error) {
      console.error('Phone change error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to process phone change' }
      });
    }
  }

  // POST /users/phone/verify - Verify New Phone
  static async verifyPhoneChange(req, res) {
    try {
      const { new_phone, otp } = req.body;

      if (!new_phone || !otp) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'New phone and OTP are required' }
        });
      }

      const user = await User.findById(req.user._id);

      // Verify OTP (hardcoded 123456 for testing)
      const isValidOTP = otp === '123456' || (user.phoneChangeOTP === otp && user.phoneChangeOTPExpiry > new Date());

      if (!isValidOTP) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OTP', message: 'OTP is invalid or expired' }
        });
      }

      // Verify phone matches pending
      if (user.pendingPhone && user.pendingPhone !== new_phone) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OTP', message: 'Phone number does not match the pending change' }
        });
      }

      // Update phone
      user.phone = new_phone;
      user.phoneChangeOTP = undefined;
      user.phoneChangeOTPExpiry = undefined;
      user.pendingPhone = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Phone number updated successfully',
        data: {
          phone: new_phone,
          updated_at: user.updatedAt
        }
      });
    } catch (error) {
      console.error('Phone verify error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to verify phone change' }
      });
    }
  }
}

module.exports = ProfileController;
