// Temporary script to unlock admin account
require('dotenv').config();
const mongoose = require('mongoose');

async function unlockAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('./modules/user-management/models/User');
    
    const admin = await User.findOne({ email: 'admin@ugo.com' });
    
    if (!admin) {
      console.log('Admin user not found. Creating...');
      await User.createAdminIfNotExists();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin found. Current state:', {
        email: admin.email,
        failedLoginAttempts: admin.failedLoginAttempts,
        lockUntil: admin.lockUntil,
        isActive: admin.isActive,
        status: admin.status
      });
      
      // Unlock the account
      admin.failedLoginAttempts = 0;
      admin.lockUntil = null;
      admin.isActive = true;
      admin.status = 'active';
      await admin.save();
      
      console.log('Admin account unlocked successfully!');
      console.log('Credentials: admin@ugo.com / admin123');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

unlockAdmin();
