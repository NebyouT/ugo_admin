// Test admin user authentication
const testAdminAuth = async () => {
  const User = require('./modules/user-management/models/User');
  
  try {
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@ugo.com' });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Admin user found:', {
      id: adminUser._id,
      email: adminUser.email,
      name: `${adminUser.firstName} ${adminUser.lastName}`,
      userType: adminUser.userType,
      role: adminUser.role,
      isActive: adminUser.isActive,
      hasPassword: !!adminUser.password
    });
    
    // Test password comparison
    const isMatch = await adminUser.comparePassword('12345678');
    console.log('Password comparison result:', isMatch);
    
    // Test findByCredentials
    try {
      const user = await User.findByCredentials('admin@ugo.com', '12345678');
      console.log('findByCredentials success:', user.email);
    } catch (error) {
      console.log('findByCredentials error:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

module.exports = testAdminAuth;
