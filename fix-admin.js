// This script will fix the existing admin user
const fixAdminUser = async () => {
  const User = require('./modules/user-management/models/User');
  
  try {
    // Find existing admin user
    const adminUser = await User.findOne({ email: 'admin@ugo.com' });
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    // Update admin user fields
    adminUser.userType = 'admin';
    adminUser.role = 'admin';
    adminUser.isActive = true;
    adminUser.isEmailVerified = true;
    adminUser.isPhoneVerified = true;
    adminUser.emailVerifiedAt = new Date();
    adminUser.phoneVerifiedAt = new Date();
    adminUser.verifiedAt = new Date();
    adminUser.lastLoginAt = new Date();
    
    // Remove problematic fields
    adminUser.otpPurpose = undefined;
    
    await adminUser.save();
    
    console.log('Admin user fixed successfully');
    console.log('Admin user details:', {
      id: adminUser._id,
      email: adminUser.email,
      name: `${adminUser.firstName} ${adminUser.lastName}`,
      userType: adminUser.userType,
      role: adminUser.role,
      isActive: adminUser.isActive
    });
    
    return adminUser;
    
  } catch (error) {
    console.error('Error fixing admin user:', error);
    throw error;
  }
};

module.exports = fixAdminUser;
