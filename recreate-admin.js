// This script will recreate the admin user with a fresh password
const recreateAdminUser = async () => {
  const User = require('./modules/user-management/models/User');
  const bcrypt = require('bcryptjs');
  
  try {
    // Delete existing admin user
    await User.deleteMany({ email: 'admin@ugo.com' });
    console.log('Deleted existing admin users');

    // Create new admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345678', salt);
    
    console.log('Password hashed with salt:', salt);
    console.log('Hashed password length:', hashedPassword.length);
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ugo.com',
      phone: '0911111111',
      password: hashedPassword,
      userType: 'admin',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      verifiedAt: new Date(),
      lastLoginAt: new Date()
    });

    await adminUser.save();
    
    console.log('Admin user recreated successfully');
    
    // Test password comparison immediately
    const testComparison = await adminUser.comparePassword('12345678');
    console.log('Immediate password comparison result:', testComparison);
    
    return adminUser;
    
  } catch (error) {
    console.error('Error recreating admin user:', error);
    throw error;
  }
};

module.exports = recreateAdminUser;
