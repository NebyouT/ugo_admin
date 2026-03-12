const UserRole = require('../models/UserRole');
const UserLevel = require('../models/UserLevel');
const User = require('../models/User');
const DriverDetail = require('../models/DriverDetail');

async function initializeUserData() {
    try {
        console.log('Initializing user management data...');

        // Create default user levels
        const defaultLevels = [
            {
                name: 'Bronze',
                description: 'Entry level for all new users',
                level: 1,
                minPoints: 0,
                maxPoints: 99,
                pointsPerRide: 1,
                pointsPerParcel: 1,
                discountPercentage: 0,
                benefits: ['Basic ride booking', 'Standard support'],
                badgeColor: '#cd7f32',
                badgeIcon: 'fas fa-medal'
            },
            {
                name: 'Silver',
                description: 'Regular customers with some loyalty',
                level: 2,
                minPoints: 100,
                maxPoints: 499,
                pointsPerRide: 2,
                pointsPerParcel: 2,
                discountPercentage: 5,
                maxDiscountPerRide: 2,
                benefits: ['Priority booking', 'Enhanced support', '5% discount'],
                badgeColor: '#c0c0c0',
                badgeIcon: 'fas fa-award'
            },
            {
                name: 'Gold',
                description: 'Loyal customers with significant points',
                level: 3,
                minPoints: 500,
                maxPoints: 1499,
                pointsPerRide: 3,
                pointsPerParcel: 3,
                discountPercentage: 10,
                maxDiscountPerRide: 5,
                benefits: ['Priority booking', 'Priority support', '10% discount', 'Exclusive offers'],
                badgeColor: '#ffd700',
                badgeIcon: 'fas fa-trophy'
            },
            {
                name: 'Platinum',
                description: 'Top-tier customers with maximum benefits',
                level: 4,
                minPoints: 1500,
                maxPoints: null,
                pointsPerRide: 5,
                pointsPerParcel: 5,
                discountPercentage: 15,
                maxDiscountPerRide: 10,
                benefits: ['VIP booking', '24/7 support', '15% discount', 'Exclusive offers', 'Free upgrades'],
                badgeColor: '#e5e4e2',
                badgeIcon: 'fas fa-crown'
            }
        ];

        for (const levelData of defaultLevels) {
            const existingLevel = await UserLevel.findOne({ name: levelData.name });
            if (!existingLevel) {
                const level = new UserLevel(levelData);
                await level.save();
                console.log(`Created user level: ${levelData.name}`);
            }
        }

        // Create default user roles
        await UserRole.createDefaultRoles();
        console.log('Default user roles created/updated');

        // Create demo users if they don't exist
        await createDemoUsers();

        console.log('User management data initialization completed successfully!');
        
    } catch (error) {
        console.error('Error initializing user data:', error);
        throw error;
    }
}

async function createDemoUsers() {
    try {
        // Get default roles and levels
        const customerRole = await UserRole.findOne({ name: 'customer' });
        const driverRole = await UserRole.findOne({ name: 'driver' });
        const bronzeLevel = await UserLevel.findOne({ name: 'Bronze' });

        if (!customerRole || !driverRole || !bronzeLevel) {
            throw new Error('Default roles or levels not found');
        }

        // Create demo customers
        const demoCustomers = [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '+12345678901',
                password: 'password123',
                userType: 'customer',
                customerType: 'regular',
                role: 'customer',
                userLevel: bronzeLevel._id,
                address: {
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'USA'
                },
                loyaltyPoints: 150
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                phone: '+12345678902',
                password: 'password123',
                userType: 'customer',
                customerType: 'student',
                role: 'customer',
                userLevel: bronzeLevel._id,
                studentInfo: {
                    studentId: 'STU001',
                    grade: '10th Grade',
                    emergencyContact: {
                        name: 'Mary Smith',
                        phone: '+12345678903',
                        relationship: 'Mother'
                    }
                },
                loyaltyPoints: 75
            },
            {
                firstName: 'Robert',
                lastName: 'Johnson',
                email: 'robert.johnson@example.com',
                phone: '+12345678904',
                password: 'password123',
                userType: 'customer',
                customerType: 'parent',
                role: 'customer',
                userLevel: bronzeLevel._id,
                parentInfo: {
                    occupation: 'Software Engineer',
                    company: 'Tech Corp'
                },
                loyaltyPoints: 220
            }
        ];

        for (const customerData of demoCustomers) {
            const existingCustomer = await User.findOne({ email: customerData.email });
            if (!existingCustomer) {
                const customer = new User(customerData);
                await customer.save();
                console.log(`Created demo customer: ${customerData.firstName} ${customerData.lastName}`);
            }
        }

        // Create demo drivers
        const demoDrivers = [
            {
                firstName: 'Mike',
                lastName: 'Wilson',
                email: 'mike.wilson@example.com',
                phone: '+12345678905',
                password: 'password123',
                userType: 'driver',
                role: 'driver',
                userLevel: bronzeLevel._id,
                driverInfo: {
                    licenseNumber: 'DL123456',
                    licenseExpiry: new Date('2025-12-31'),
                    serviceArea: 'Downtown',
                    services: ['ride'],
                    isVerified: true
                },
                address: {
                    street: '456 Oak Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    zipCode: '90001',
                    country: 'USA'
                },
                emergencyContact: {
                    name: 'Sarah Wilson',
                    phone: '+12345678906',
                    relationship: 'Spouse'
                }
            },
            {
                firstName: 'Sarah',
                lastName: 'Brown',
                email: 'sarah.brown@example.com',
                phone: '+12345678907',
                password: 'password123',
                userType: 'driver',
                role: 'driver',
                userLevel: bronzeLevel._id,
                driverInfo: {
                    licenseNumber: 'DL789012',
                    licenseExpiry: new Date('2025-06-30'),
                    serviceArea: 'Airport',
                    services: ['ride', 'parcel'],
                    isVerified: true
                },
                address: {
                    street: '789 Pine Rd',
                    city: 'Chicago',
                    state: 'IL',
                    zipCode: '60007',
                    country: 'USA'
                },
                emergencyContact: {
                    name: 'Tom Brown',
                    phone: '+12345678908',
                    relationship: 'Brother'
                }
            }
        ];

        for (const driverData of demoDrivers) {
            const existingDriver = await User.findOne({ email: driverData.email });
            if (!existingDriver) {
                const driver = new User(driverData);
                await driver.save();

                // Create driver details
                const driverDetail = new DriverDetail({
                    user: driver._id,
                    services: driverData.driverInfo.services,
                    verificationStatus: 'verified',
                    availabilityStatus: 'available',
                    averageRating: 4.5,
                    totalRatings: 25,
                    rideCount: 150,
                    parcelCount: 30,
                    totalEarnings: 2500
                });
                await driverDetail.save();

                console.log(`Created demo driver: ${driverData.firstName} ${driverData.lastName}`);
            }
        }

        console.log('Demo users created successfully!');

    } catch (error) {
        console.error('Error creating demo users:', error);
        throw error;
    }
}

// Export for use in other scripts
module.exports = {
    initializeUserData,
    createDemoUsers
};

// Run if called directly
if (require.main === module) {
    const mongoose = require('mongoose');
    
    // Connect to MongoDB
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo')
        .then(() => {
            console.log('Connected to MongoDB');
            return initializeUserData();
        })
        .then(() => {
            console.log('Initialization completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Initialization failed:', error);
            process.exit(1);
        });
}
