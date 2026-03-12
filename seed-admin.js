// This script will be called from the running server
const createAdminUser = async () => {
  const User = require('./modules/user-management/models/User');
  const bcrypt = require('bcryptjs');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@ugo.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists in user-management model');
      return existingAdmin;
    }

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
    
    console.log('Admin user created successfully in user-management model');
    return adminUser;
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

module.exports = createAdminUser;
