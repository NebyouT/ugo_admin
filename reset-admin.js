// This script will reset the admin user
const resetAdminUser = async () => {
  const User = require('./modules/user-management/models/User');
  const bcrypt = require('bcryptjs');
  
  try {
    // Delete existing admin user
    await User.deleteOne({ email: 'admin@ugo.com' });
    console.log('Deleted existing admin user');

    // Create new admin user
    const hashedPassword = await bcrypt.hash('12345678', 12);
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ugo.com',
      phone: '0911111111',
      password: hashedPassword,
      userType: 'admin',
      role: 'admin',
      status: 'active',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      verifiedAt: new Date(),
      lastLoginAt: new Date()
    });

    await adminUser.save();
    
    console.log('Admin user recreated successfully in user-management model');
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
    console.error('Error resetting admin user:', error);
    throw error;
  }
};

module.exports = resetAdminUser;
