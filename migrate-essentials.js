#!/usr/bin/env node

/**
 * UGO Admin Essential Data Migration
 * 
 * Simplified migration script for essential data only.
 * Use this for quick migration of critical data.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./modules/auth/models/User');
const School = require('./modules/schools/models/School');
const Setting = require('./modules/integrations/models/Setting');

async function migrateEssentials() {
    console.log('🚀 Starting essential data migration...\n');

    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to database');

        // 1. Create default admin user
        console.log('\n👑 Creating default admin user...');
        const existingAdmin = await User.findOne({ userType: 'admin' });
        
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123456', 12);
            
            const admin = new User({
                firstName: 'System',
                lastName: 'Administrator',
                email: 'admin@ugo.com',
                phone: '+251911000001',
                password: hashedPassword,
                userType: 'admin',
                status: 'active',
                emailVerified: true
            });

            await admin.save();
            console.log('✅ Default admin created (admin@ugo.com / admin123456)');
        } else {
            console.log('✅ Admin user already exists');
        }

        // 2. Create default schools
        console.log('\n🏫 Creating default schools...');
        const defaultSchools = [
            {
                name: 'Addis Ababa International School',
                latitude: 9.0192,
                longitude: 38.7525,
                address: {
                    street: 'Bole Road',
                    city: 'Addis Ababa',
                    region: 'Addis Ababa',
                    country: 'Ethiopia',
                    formattedAddress: 'Bole Road, Addis Ababa, Ethiopia'
                },
                type: 'primary',
                grades: { from: '1', to: '8' },
                studentCapacity: 500,
                currentStudents: 0,
                serviceRadius: 5,
                isActive: true,
                status: 'active'
            },
            {
                name: 'Mekelle Primary School',
                latitude: 13.4967,
                longitude: 39.4753,
                address: {
                    street: 'Main Street',
                    city: 'Mekelle',
                    region: 'Tigray',
                    country: 'Ethiopia',
                    formattedAddress: 'Main Street, Mekelle, Ethiopia'
                },
                type: 'primary',
                grades: { from: '1', to: '8' },
                studentCapacity: 300,
                currentStudents: 0,
                serviceRadius: 5,
                isActive: true,
                status: 'active'
            },
            {
                name: 'Dire Dawa Academy',
                latitude: 9.5944,
                longitude: 41.8661,
                address: {
                    street: 'Academy Road',
                    city: 'Dire Dawa',
                    region: 'Dire Dawa',
                    country: 'Ethiopia',
                    formattedAddress: 'Academy Road, Dire Dawa, Ethiopia'
                },
                type: 'secondary',
                grades: { from: '9', to: '12' },
                studentCapacity: 400,
                currentStudents: 0,
                serviceRadius: 5,
                isActive: true,
                status: 'active'
            }
        ];

        for (const schoolData of defaultSchools) {
            const existingSchool = await School.findOne({ name: schoolData.name });
            
            if (!existingSchool) {
                const school = new School({
                    ...schoolData,
                    location: {
                        type: 'Point',
                        coordinates: [schoolData.longitude, schoolData.latitude]
                    }
                });
                
                await school.save();
                console.log(`✅ Created school: ${schoolData.name}`);
            } else {
                console.log(`✅ School already exists: ${schoolData.name}`);
            }
        }

        // 3. Create default integration settings
        console.log('\n⚙️ Creating default integration settings...');
        const defaultSettings = [
            {
                keyName: 'google_maps',
                settingsType: 'map_api',
                isActive: true,
                mode: 'test',
                testValues: {
                    api_key: 'YOUR_TEST_GOOGLE_MAPS_API_KEY'
                },
                liveValues: {
                    api_key: 'YOUR_LIVE_GOOGLE_MAPS_API_KEY'
                }
            },
            {
                keyName: 'sms_gateway',
                settingsType: 'sms_gateway',
                isActive: false,
                mode: 'test',
                testValues: {
                    api_key: 'YOUR_SMS_API_KEY',
                    sender_id: 'UGO',
                    provider: 'twilio'
                }
            },
            {
                keyName: 'push_notification',
                settingsType: 'push_notification',
                isActive: false,
                mode: 'test',
                testValues: {
                    firebase_server_key: 'YOUR_FIREBASE_SERVER_KEY',
                    firebase_config: {
                        apiKey: "your-api-key",
                        authDomain: "your-auth-domain",
                        projectId: "your-project-id",
                        messagingSenderId: "your-sender-id"
                    }
                }
            },
            {
                keyName: 'email_config',
                settingsType: 'email_config',
                isActive: false,
                mode: 'test',
                testValues: {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    user: 'your-email@gmail.com',
                    pass: 'your-app-password'
                }
            }
        ];

        for (const settingData of defaultSettings) {
            const existingSetting = await Setting.findOne({ keyName: settingData.keyName });
            
            if (!existingSetting) {
                const setting = new Setting(settingData);
                await setting.save();
                console.log(`✅ Created setting: ${settingData.keyName}`);
            } else {
                console.log(`✅ Setting already exists: ${settingData.keyName}`);
            }
        }

        // 4. Show summary
        const userCount = await User.countDocuments();
        const schoolCount = await School.countDocuments();
        const settingCount = await Setting.countDocuments();

        console.log('\n📊 Migration Summary:');
        console.log(`👥 Users: ${userCount}`);
        console.log(`🏫 Schools: ${schoolCount}`);
        console.log(`⚙️  Settings: ${settingCount}`);
        
        console.log('\n🎉 Essential data migration completed successfully!');
        console.log('\n🔑 Default Login Credentials:');
        console.log('   Email: admin@ugo.com');
        console.log('   Password: admin123456');
        console.log('\n⚠️  Remember to:');
        console.log('   1. Update Google Maps API key in settings');
        console.log('   2. Change default admin password');
        console.log('   3. Configure other integrations as needed');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateEssentials().catch(console.error);
}

module.exports = migrateEssentials;
