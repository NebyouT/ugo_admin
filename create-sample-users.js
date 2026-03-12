// Create sample users for testing the authentication management system
const createSampleUsers = async () => {
  const User = require('./modules/user-management/models/User');
  const bcrypt = require('bcryptjs');
  
  try {
    // Sample user data
    const sampleUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '0912345678',
        password: 'password123',
        userType: 'customer',
        customerType: 'student',
        isActive: false, // Pending verification
        isEmailVerified: false,
        isPhoneVerified: false
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '0912345679',
        password: 'password123',
        userType: 'customer',
        customerType: 'parent',
        isActive: true, // Verified
        isEmailVerified: true,
        isPhoneVerified: true,
        emailVerifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        phoneVerifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike.wilson@example.com',
        phone: '0912345680',
        password: 'password123',
        userType: 'driver',
        isActive: false, // Pending verification
        isEmailVerified: true,
        isPhoneVerified: false,
        emailVerifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '0912345681',
        password: 'password123',
        userType: 'customer',
        customerType: 'regular',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        emailVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        phoneVerifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastLoginAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    // Delete existing sample users
    await User.deleteMany({ 
      email: { $in: sampleUsers.map(u => u.email) }
    });
    console.log('Deleted existing sample users');

    // Create new sample users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Created sample user: ${user.email} (${user.userType})`);
    }

    console.log(`Successfully created ${createdUsers.length} sample users`);
    return createdUsers;
    
  } catch (error) {
    console.error('Error creating sample users:', error);
    throw error;
  }
};

module.exports = createSampleUsers;
