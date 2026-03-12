const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./modules/user-management/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Create admin user
const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@ugo.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists in user-management model');
      console.log('Admin user details:', {
        id: existingAdmin._id,
        email: existingAdmin.email,
        name: `${existingAdmin.firstName} ${existingAdmin.lastName}`,
        userType: existingAdmin.userType,
        role: existingAdmin.role,
        isActive: existingAdmin.isActive
      });
      return;
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
    console.log('Admin user details:', {
      id: adminUser._id,
      email: adminUser.email,
      name: `${adminUser.firstName} ${adminUser.lastName}`,
      userType: adminUser.userType,
      role: adminUser.role,
      isActive: adminUser.isActive
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
createAdminUser();
