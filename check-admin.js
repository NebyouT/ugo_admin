// Check admin user details
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('./modules/user-management/models/User');
    
    const admins = await User.find({ role: 'admin' }).select('+password');
    
    console.log(`Found ${admins.length} admin user(s):`);
    
    for (const admin of admins) {
      console.log('\n---');
      console.log('ID:', admin._id);
      console.log('Email:', admin.email);
      console.log('First Name:', admin.firstName);
      console.log('Last Name:', admin.lastName);
      console.log('Role:', admin.role);
      console.log('UserType:', admin.userType);
      console.log('IsActive:', admin.isActive);
      console.log('Status:', admin.status);
      console.log('Failed Attempts:', admin.failedLoginAttempts);
      console.log('Lock Until:', admin.lockUntil);
      
      // Test password
      const testPasswords = ['admin123', '12345678', 'admin@123'];
      for (const pwd of testPasswords) {
        const match = await bcrypt.compare(pwd, admin.password);
        if (match) {
          console.log(`✓ Password "${pwd}" MATCHES`);
        }
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
