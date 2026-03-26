#!/usr/bin/env node

/**
 * Fix Admin Login Script
 * 
 * This script ensures the admin user exists in the correct User model
 * with the proper credentials for the admin login system.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./modules/user-management/models/User');

async function fixAdminLogin() {
    console.log('🔧 Fixing admin login...\n');

    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URL);
        console.log('✅ Connected to database');

        // Check if admin exists
        let admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@ugo.com' });
        
        if (!admin) {
            console.log('📝 Creating admin user...');
            
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || '12345678', 12);
            
            admin = new User({
                firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
                lastName: process.env.ADMIN_LAST_NAME || 'User',
                email: process.env.ADMIN_EMAIL || 'admin@ugo.com',
                phone: '+251911000001',
                password: hashedPassword,
                role: 'admin',
                userType: 'admin',
                isActive: true,
                status: 'active',
                emailVerified: true
            });
            
            await admin.save();
            console.log('✅ Admin user created');
        } else {
            console.log('🔄 Updating admin user...');
            
            // Update password and ensure correct fields
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || '12345678', 12);
            
            await User.updateOne(
                { email: process.env.ADMIN_EMAIL || 'admin@ugo.com' },
                { 
                    password: hashedPassword,
                    isActive: true,
                    status: 'active',
                    role: 'admin',
                    userType: 'admin'
                }
            );
            
            console.log('✅ Admin user updated');
        }

        // Test login
        console.log('\n🧪 Testing login...');
        const testAdmin = await User.findByCredentials(
            process.env.ADMIN_EMAIL || 'admin@ugo.com', 
            process.env.ADMIN_PASSWORD || '12345678'
        );

        if (testAdmin) {
            console.log('🎉 LOGIN SUCCESS!');
            console.log('📋 Login Credentials:');
            console.log('   Email:', process.env.ADMIN_EMAIL || 'admin@ugo.com');
            console.log('   Password:', process.env.ADMIN_PASSWORD || '12345678');
            console.log('   Role:', testAdmin.role);
            console.log('   Status:', testAdmin.status);
            
            // Test token generation
            const token = testAdmin.generateAuthToken();
            console.log('   Token:', token ? 'Generated successfully' : 'Failed to generate');
        } else {
            console.log('❌ Login test failed');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run if executed directly
if (require.main === module) {
    fixAdminLogin().catch(console.error);
}

module.exports = fixAdminLogin;
