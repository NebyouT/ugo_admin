// This script will create a simple admin user without problematic fields
const createSimpleAdmin = async () => {
  const User = require('./modules/user-management/models/User');
  const bcrypt = require('bcryptjs');
  
  try {
    // Delete any existing admin user
    await User.deleteMany({ email: 'admin@ugo.com' });
    console.log('Deleted existing admin users');

    // Create new admin user with only required fields
    const hashedPassword = await bcrypt.hash('12345678', 12);
    
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
    
    console.log('Admin user created successfully');
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
    console.error('Error creating admin user:', error);
    throw error;
  }
};

module.exports = createSimpleAdmin;
