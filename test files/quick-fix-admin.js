// Quick fix for admin login - create admin with known working password
const quickFixAdmin = async () => {
  const User = require('./modules/user-management/models/User');
  
  try {
    // Delete existing admin user
    await User.deleteMany({ email: 'admin@ugo.com' });
    console.log('Deleted existing admin users');

    // Create admin user with plain password (will be hashed by middleware)
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ugo.com',
      phone: '0911111111',
      password: '12345678', // Plain password - middleware will hash it
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
    console.log('Admin user created with quick fix');
    
    return adminUser;
    
  } catch (error) {
    console.error('Quick fix admin error:', error);
    throw error;
  }
};

module.exports = quickFixAdmin;
