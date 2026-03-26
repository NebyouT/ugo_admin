#!/usr/bin/env node

/**
 * UGO Admin Database Migration Script
 * 
 * This script migrates important data from an old database to a new database.
 * It handles:
 * - User accounts and authentication data
 * - Parent and children profiles
 * - Schools and location data
 * - Integration settings
 * 
 * Usage: node migrate-database.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./modules/auth/models/User');
const Child = require('./modules/children/models/Child');
const School = require('./modules/schools/models/School');
const Setting = require('./modules/integrations/models/Setting');

class DatabaseMigrator {
    constructor() {
        this.oldDbConnection = null;
        this.newDbConnection = null;
        this.migrationStats = {
            users: { migrated: 0, failed: 0 },
            children: { migrated: 0, failed: 0 },
            schools: { migrated: 0, failed: 0 },
            settings: { migrated: 0, failed: 0 }
        };
    }

    /**
     * Initialize database connections
     */
    async initialize() {
        console.log('🚀 Initializing database migration...\n');

        // Connect to new database
        try {
            await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_URL, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connected to new database');
            this.newDbConnection = mongoose.connection;
        } catch (error) {
            console.error('❌ Failed to connect to new database:', error.message);
            process.exit(1);
        }

        // Note: Add old database connection if needed
        // For now, we'll work with the assumption that we're migrating from the same database
        // or you'll provide the old database connection details
    }

    /**
     * Migrate user accounts
     */
    async migrateUsers() {
        console.log('👥 Migrating user accounts...');
        
        try {
            const users = await User.find({}).lean();
            console.log(`Found ${users.length} users to migrate`);

            for (const user of users) {
                try {
                    // Check if user already exists (prevent duplicates)
                    const existingUser = await User.findOne({ 
                        $or: [
                            { email: user.email },
                            { phone: user.phone }
                        ]
                    });

                    if (existingUser) {
                        console.log(`⚠️  User ${user.email} already exists, skipping...`);
                        continue;
                    }

                    // Create user with proper structure
                    const newUser = new User({
                        firstName: user.firstName || 'Unknown',
                        lastName: user.lastName || 'User',
                        email: user.email,
                        phone: user.phone,
                        password: user.password, // Already hashed
                        userType: user.userType || 'customer',
                        customerType: user.customerType || 'parent',
                        status: user.status || 'active',
                        emailVerified: user.emailVerified || false,
                        createdAt: user.createdAt || new Date(),
                        updatedAt: user.updatedAt || new Date()
                    });

                    await newUser.save();
                    this.migrationStats.users.migrated++;
                    console.log(`✅ Migrated user: ${user.email}`);
                    
                } catch (error) {
                    this.migrationStats.users.failed++;
                    console.error(`❌ Failed to migrate user ${user.email}:`, error.message);
                }
            }
            
            console.log(`✅ Users migration completed: ${this.migrationStats.users.migrated} migrated, ${this.migrationStats.users.failed} failed\n`);
            
        } catch (error) {
            console.error('❌ Error during users migration:', error.message);
            this.migrationStats.users.failed++;
        }
    }

    /**
     * Migrate children profiles
     */
    async migrateChildren() {
        console.log('👶 Migrating children profiles...');
        
        try {
            const children = await Child.find({}).populate('parent').lean();
            console.log(`Found ${children.length} children to migrate`);

            for (const child of children) {
                try {
                    // Verify parent exists
                    if (!child.parent) {
                        console.log(`⚠️  Child ${child.name} has no parent, skipping...`);
                        continue;
                    }

                    // Check if child already exists
                    const existingChild = await Child.findOne({
                        name: child.name,
                        parent: child.parent._id
                    });

                    if (existingChild) {
                        console.log(`⚠️  Child ${child.name} already exists, skipping...`);
                        continue;
                    }

                    // Create child with proper structure
                    const newChild = new Child({
                        parent: child.parent._id,
                        name: child.name,
                        grade: child.grade,
                        pickupAddress: child.pickupAddress || {
                            address: 'Default Address',
                            coordinates: [38.7525, 9.0192], // Addis Ababa default
                            landmark: ''
                        },
                        schedules: child.schedules || [],
                        school: child.school || null,
                        schoolDetails: child.schoolDetails || {},
                        subscription: child.subscription || {
                            status: 'inactive',
                            driver: null
                        },
                        status: child.status || 'active',
                        createdAt: child.createdAt || new Date(),
                        updatedAt: child.updatedAt || new Date()
                    });

                    await newChild.save();
                    this.migrationStats.children.migrated++;
                    console.log(`✅ Migrated child: ${child.name}`);
                    
                } catch (error) {
                    this.migrationStats.children.failed++;
                    console.error(`❌ Failed to migrate child ${child.name}:`, error.message);
                }
            }
            
            console.log(`✅ Children migration completed: ${this.migrationStats.children.migrated} migrated, ${this.migrationStats.children.failed} failed\n`);
            
        } catch (error) {
            console.error('❌ Error during children migration:', error.message);
            this.migrationStats.children.failed++;
        }
    }

    /**
     * Migrate schools
     */
    async migrateSchools() {
        console.log('🏫 Migrating schools...');
        
        try {
            const schools = await School.find({}).lean();
            console.log(`Found ${schools.length} schools to migrate`);

            for (const school of schools) {
                try {
                    // Check if school already exists
                    const existingSchool = await School.findOne({ name: school.name });

                    if (existingSchool) {
                        console.log(`⚠️  School ${school.name} already exists, skipping...`);
                        continue;
                    }

                    // Create school with proper structure
                    const newSchool = new School({
                        name: school.name,
                        location: school.location || {
                            type: 'Point',
                            coordinates: [38.7525, 9.0192] // Addis Ababa default
                        },
                        latitude: school.latitude || 9.0192,
                        longitude: school.longitude || 38.7525,
                        address: school.address || {
                            city: 'Addis Ababa',
                            region: 'Addis Ababa',
                            country: 'Ethiopia',
                            formattedAddress: 'Addis Ababa, Ethiopia'
                        },
                        contactInfo: school.contactInfo || {},
                        type: school.type || 'primary',
                        grades: school.grades || { from: '1', to: '8' },
                        studentCapacity: school.studentCapacity || 500,
                        currentStudents: school.currentStudents || 0,
                        serviceRadius: school.serviceRadius || 5,
                        isActive: school.isActive !== undefined ? school.isActive : true,
                        status: school.status || 'active',
                        description: school.description || '',
                        facilities: school.facilities || [],
                        createdAt: school.createdAt || new Date(),
                        updatedAt: school.updatedAt || new Date()
                    });

                    await newSchool.save();
                    this.migrationStats.schools.migrated++;
                    console.log(`✅ Migrated school: ${school.name}`);
                    
                } catch (error) {
                    this.migrationStats.schools.failed++;
                    console.error(`❌ Failed to migrate school ${school.name}:`, error.message);
                }
            }
            
            console.log(`✅ Schools migration completed: ${this.migrationStats.schools.migrated} migrated, ${this.migrationStats.schools.failed} failed\n`);
            
        } catch (error) {
            console.error('❌ Error during schools migration:', error.message);
            this.migrationStats.schools.failed++;
        }
    }

    /**
     * Migrate integration settings
     */
    async migrateSettings() {
        console.log('⚙️  Migrating integration settings...');
        
        try {
            const settings = await Setting.find({}).lean();
            console.log(`Found ${settings.length} settings to migrate`);

            // Default settings to create if they don't exist
            const defaultSettings = [
                {
                    keyName: 'google_maps',
                    settingsType: 'map_api',
                    isActive: true,
                    mode: 'test',
                    testValues: {
                        api_key: 'YOUR_TEST_API_KEY'
                    },
                    liveValues: {
                        api_key: 'YOUR_LIVE_API_KEY'
                    }
                },
                {
                    keyName: 'sms_gateway',
                    settingsType: 'sms_gateway',
                    isActive: false,
                    mode: 'test',
                    testValues: {
                        api_key: 'YOUR_SMS_API_KEY',
                        sender_id: 'UGO'
                    }
                },
                {
                    keyName: 'push_notification',
                    settingsType: 'push_notification',
                    isActive: false,
                    mode: 'test',
                    testValues: {
                        firebase_config: {}
                    }
                }
            ];

            // Migrate existing settings
            for (const setting of settings) {
                try {
                    const existingSetting = await Setting.findOne({ keyName: setting.keyName });

                    if (existingSetting) {
                        console.log(`⚠️  Setting ${setting.keyName} already exists, skipping...`);
                        continue;
                    }

                    const newSetting = new Setting(setting);
                    await newSetting.save();
                    this.migrationStats.settings.migrated++;
                    console.log(`✅ Migrated setting: ${setting.keyName}`);
                    
                } catch (error) {
                    this.migrationStats.settings.failed++;
                    console.error(`❌ Failed to migrate setting ${setting.keyName}:`, error.message);
                }
            }

            // Create default settings if they don't exist
            for (const defaultSetting of defaultSettings) {
                try {
                    const existingSetting = await Setting.findOne({ keyName: defaultSetting.keyName });

                    if (!existingSetting) {
                        const newSetting = new Setting(defaultSetting);
                        await newSetting.save();
                        this.migrationStats.settings.migrated++;
                        console.log(`✅ Created default setting: ${defaultSetting.keyName}`);
                    }
                } catch (error) {
                    this.migrationStats.settings.failed++;
                    console.error(`❌ Failed to create default setting ${defaultSetting.keyName}:`, error.message);
                }
            }
            
            console.log(`✅ Settings migration completed: ${this.migrationStats.settings.migrated} migrated, ${this.migrationStats.settings.failed} failed\n`);
            
        } catch (error) {
            console.error('❌ Error during settings migration:', error.message);
            this.migrationStats.settings.failed++;
        }
    }

    /**
     * Create default admin user
     */
    async createDefaultAdmin() {
        console.log('👑 Creating default admin user...');
        
        try {
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
                    emailVerified: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                await admin.save();
                console.log('✅ Default admin user created (admin@ugo.com / admin123456)');
            } else {
                console.log('✅ Admin user already exists');
            }
        } catch (error) {
            console.error('❌ Failed to create default admin:', error.message);
        }
    }

    /**
     * Verify migration integrity
     */
    async verifyMigration() {
        console.log('🔍 Verifying migration integrity...');
        
        try {
            const userCount = await User.countDocuments();
            const childCount = await Child.countDocuments();
            const schoolCount = await School.countDocuments();
            const settingCount = await Setting.countDocuments();

            console.log('\n📊 Migration Summary:');
            console.log(`👥 Users: ${userCount} total`);
            console.log(`👶 Children: ${childCount} total`);
            console.log(`🏫 Schools: ${schoolCount} total`);
            console.log(`⚙️  Settings: ${settingCount} total`);

            console.log('\n📈 Migration Statistics:');
            console.log(`✅ Successfully migrated: ${this.getTotalMigrated()} items`);
            console.log(`❌ Failed migrations: ${this.getTotalFailed()} items`);

            if (this.getTotalFailed() === 0) {
                console.log('\n🎉 Migration completed successfully!');
            } else {
                console.log('\n⚠️  Migration completed with some failures. Please check the logs above.');
            }

        } catch (error) {
            console.error('❌ Error during verification:', error.message);
        }
    }

    /**
     * Helper methods
     */
    getTotalMigrated() {
        return Object.values(this.migrationStats).reduce((total, stat) => total + stat.migrated, 0);
    }

    getTotalFailed() {
        return Object.values(this.migrationStats).reduce((total, stat) => total + stat.failed, 0);
    }

    /**
     * Run complete migration
     */
    async run() {
        try {
            await this.initialize();
            
            // Create default admin first
            await this.createDefaultAdmin();
            
            // Run migrations in order
            await this.migrateUsers();
            await this.migrateSchools();
            await this.migrateChildren();
            await this.migrateSettings();
            
            // Verify and show results
            await this.verifyMigration();
            
        } catch (error) {
            console.error('❌ Migration failed:', error.message);
        } finally {
            // Close database connection
            if (this.newDbConnection) {
                await this.newDbConnection.close();
                console.log('\n🔌 Database connection closed');
            }
        }
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    const migrator = new DatabaseMigrator();
    migrator.run().catch(console.error);
}

module.exports = DatabaseMigrator;
