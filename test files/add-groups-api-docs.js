// Add Groups API endpoints to the database for API documentation
const mongoose = require('mongoose');

async function addGroupsApiDocs() {
    try {
        // Load environment variables
        require('dotenv').config();
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Import ApiEndpoint model
        const ApiEndpoint = require('../modules/api-docs/models/ApiEndpoint');
        
        console.log('\n📚 Adding Groups API endpoints to documentation...\n');
        
        // Groups API endpoints
        const groupsEndpoints = [
            {
                title: 'Get all groups',
                method: 'GET',
                endpoint: '/api/groups',
                description: 'Get all available groups with optional filtering by school and location',
                category: 'Groups',
                requiresAuth: true,
                requestBody: null,
                requestExample: null,
                responseSuccess: {
                    success: true,
                    message: 'Groups retrieved successfully',
                    data: {
                        groups: [
                            {
                                _id: 'group_001',
                                name: 'Morning Group A',
                                school: {
                                    _id: 'school_001',
                                    name: 'Addis Ababa Primary School',
                                    address: { city: 'Addis Ababa' }
                                },
                                driver: {
                                    _id: 'driver_001',
                                    name: 'Ato Bekele Tadesse',
                                    phone: '0933456789',
                                    rating: 4.8
                                },
                                schedule: {
                                    pickup_time: '07:00',
                                    drop_time: '16:30',
                                    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                                },
                                capacity: 8,
                                current_members: 5,
                                base_price: 2500,
                                status: 'open'
                            }
                        ],
                        total: 1
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'FETCH_FAILED',
                        message: 'Failed to fetch groups'
                    }
                },
                notes: 'Use query parameters to filter by school_id, latitude, longitude, or radius',
                order: 1
            },
            {
                title: 'Create a new group',
                method: 'POST',
                endpoint: '/api/groups',
                description: 'Create a new ride-sharing group with school assignment and schedule',
                category: 'Groups',
                requiresAuth: true,
                requestBody: {
                    name: 'string (required)',
                    school: 'string (required) - School ID',
                    schedule: {
                        pickup_time: 'string (required) - HH:MM format',
                        drop_time: 'string (required) - HH:MM format',
                        days: 'array - Operating days'
                    },
                    capacity: 'integer (required, 1-15)',
                    base_price: 'number (required, minimum 0)',
                    service_radius: 'number (optional, default 5)',
                    description: 'string (optional)'
                },
                requestExample: `{
  "name": "Morning Group A",
  "school": "507f1f77bcf86cd799439011",
  "schedule": {
    "pickup_time": "07:00",
    "drop_time": "16:30",
    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  "capacity": 8,
  "base_price": 2500,
  "service_radius": 5,
  "description": "Morning pickup group for primary students"
}`,
                responseSuccess: {
                    success: true,
                    message: 'Group created successfully',
                    data: {
                        group: {
                            _id: 'group_001',
                            name: 'Morning Group A',
                            school: '507f1f77bcf86cd799439011',
                            schedule: {
                                pickup_time: '07:00',
                                drop_time: '16:30',
                                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                            },
                            capacity: 8,
                            current_members: 0,
                            base_price: 2500,
                            status: 'open',
                            createdAt: '2026-03-16T10:00:00.000Z'
                        }
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Name, school, schedule, capacity, and base price are required'
                    }
                },
                notes: 'School must exist and be active. Group starts with 0 members and "open" status.',
                order: 2
            },
            {
                title: 'Get group details',
                method: 'GET',
                endpoint: '/api/groups/:id',
                description: 'Get detailed information about a specific group including driver and members',
                category: 'Groups',
                requiresAuth: true,
                requestBody: null,
                requestExample: null,
                responseSuccess: {
                    success: true,
                    data: {
                        group: {
                            _id: 'group_001',
                            name: 'Morning Group A',
                            school: {
                                _id: 'school_001',
                                name: 'Addis Ababa Primary School',
                                address: { city: 'Addis Ababa' }
                            },
                            driver: {
                                _id: 'driver_001',
                                name: 'Ato Bekele Tadesse',
                                phone: '0933456789',
                                rating: 4.8,
                                vehicle: {
                                    type: 'Bajaj',
                                    color: 'Blue',
                                    plate: '3-12345'
                                }
                            },
                            schedule: {
                                pickup_time: '07:00',
                                drop_time: '16:30',
                                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                            },
                            capacity: 8,
                            current_members: 5,
                            base_price: 2500,
                            status: 'open',
                            members: [
                                {
                                    _id: 'student_001',
                                    name: 'Meron Hailu',
                                    pickup_location: { address: 'Bole, House #123' }
                                }
                            ]
                        }
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Group not found'
                    }
                },
                notes: 'Returns complete group information with driver details and member list.',
                order: 3
            },
            {
                title: 'Update group',
                method: 'PUT',
                endpoint: '/api/groups/:id',
                description: 'Update existing group information including schedule, capacity, or status',
                category: 'Groups',
                requiresAuth: true,
                requestBody: {
                    name: 'string (optional)',
                    schedule: 'object (optional)',
                    capacity: 'integer (optional, 1-15)',
                    base_price: 'number (optional, minimum 0)',
                    status: 'string (optional) - open, full, inactive, cancelled'
                },
                requestExample: `{
  "name": "Updated Group Name",
  "schedule": {
    "pickup_time": "07:30",
    "drop_time: "16:00"
  },
  "capacity": 10,
  "base_price": 3000,
  "status": "open"
}`,
                responseSuccess: {
                    success: true,
                    message: 'Group updated successfully',
                    data: {
                        group: {
                            _id: 'group_001',
                            name: 'Updated Group Name',
                            schedule: {
                                pickup_time: '07:30',
                                drop_time: '16:00'
                            },
                            capacity: 10,
                            base_price: 3000,
                            updatedAt: '2026-03-16T11:00:00.000Z'
                        }
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Group not found'
                    }
                },
                notes: 'Only provided fields are updated. Capacity cannot be less than current members.',
                order: 4
            },
            {
                title: 'Delete group',
                method: 'DELETE',
                endpoint: '/api/groups/:id',
                description: 'Delete a group permanently (use with caution)',
                category: 'Groups',
                requiresAuth: true,
                requestBody: null,
                requestExample: null,
                responseSuccess: {
                    success: true,
                    message: 'Group deleted successfully'
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Group not found'
                    }
                },
                notes: 'This action is irreversible. Consider deactivating instead of deleting.',
                order: 5
            },
            {
                title: 'Search groups',
                method: 'POST',
                endpoint: '/api/groups/search',
                description: 'Search groups by location, school, or other criteria',
                category: 'Groups',
                requiresAuth: true,
                requestBody: {
                    latitude: 'number (optional)',
                    longitude: 'number (optional)',
                    radius: 'number (optional, default 10km)',
                    school_id: 'string (optional)',
                    status: 'string (optional)',
                    has_availability: 'boolean (optional)'
                },
                requestExample: `{
  "latitude": 9.0192,
  "longitude": 38.7525,
  "radius": 5,
  "school_id": "school_001",
  "status": "open",
  "has_availability": true
}`,
                responseSuccess: {
                    success: true,
                    data: {
                        groups: [
                            {
                                _id: 'group_001',
                                name: 'Morning Group A',
                                school: { name: 'Addis Ababa Primary School' },
                                distance_km: 2.3,
                                spots_left: 3,
                                base_price: 2500
                            }
                        ],
                        total: 1,
                        search_center: { latitude: 9.0192, longitude: 38.7525 }
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'SEARCH_FAILED',
                        message: 'Failed to search groups'
                    }
                },
                notes: 'Use location parameters for geospatial search. Returns groups sorted by distance.',
                order: 6
            },
            {
                title: 'Get group driver info',
                method: 'GET',
                endpoint: '/api/groups/:id/driver',
                description: 'Get detailed driver information for a specific group',
                category: 'Groups',
                requiresAuth: true,
                requestBody: null,
                requestExample: null,
                responseSuccess: {
                    success: true,
                    data: {
                        driver: {
                            _id: 'driver_001',
                            full_name: 'Ato Bekele Tadesse',
                            phone: '0933456789',
                            photo: 'https://storage.ugo.et/drivers/driver_001.jpg',
                            rating: {
                                overall: 4.8,
                                safety: 4.9,
                                punctuality: 4.7,
                                communication: 4.6,
                                total_reviews: 45
                            },
                            experience: {
                                total_rides: 120,
                                total_students: 25,
                                member_since: '2025-06-15'
                            },
                            vehicle: {
                                type: 'Bajaj',
                                color: 'Blue',
                                plate: '3-12345',
                                capacity: 8,
                                photo: 'https://storage.ugo.et/vehicles/vehicle_001.jpg'
                            },
                            reviews: [
                                {
                                    parent_name: 'Meron H.',
                                    rating: 5.0,
                                    comment: 'Very punctual and safe!',
                                    created_at: '2026-02-20T10:00:00Z'
                                }
                            ]
                        }
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'NO_DRIVER',
                        message: 'No driver assigned to this group'
                    }
                },
                notes: 'Returns null if no driver is assigned. Voting information may be included.',
                order: 7
            },
            {
                title: 'Check group availability',
                method: 'GET',
                endpoint: '/api/groups/:id/availability',
                description: 'Check if a group has available spots and current enrollment status',
                category: 'Groups',
                requiresAuth: true,
                requestBody: null,
                requestExample: null,
                responseSuccess: {
                    success: true,
                    data: {
                        availability: {
                            group_id: 'group_001',
                            group_name: 'Morning Group A',
                            capacity: 8,
                            current_members: 5,
                            spots_left: 3,
                            is_available: true,
                            status: 'open',
                            waitlist_count: 0
                        }
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Group not found'
                    }
                },
                notes: 'Use this endpoint to check if new members can join before enrollment.',
                order: 8
            },
            {
                title: 'Get group schedule',
                method: 'GET',
                endpoint: '/api/groups/:id/schedule',
                description: 'Get detailed schedule information including school hours and pickup/drop times',
                category: 'Groups',
                requiresAuth: true,
                requestBody: null,
                requestExample: null,
                responseSuccess: {
                    success: true,
                    data: {
                        schedule: {
                            group_id: 'group_001',
                            group_name: 'Morning Group A',
                            school: {
                                id: 'school_001',
                                name: 'Dire Dawa Primary School',
                                start_time: '08:00',
                                end_time: '16:00'
                            },
                            schedule: {
                                morning: {
                                    type: 'pickup',
                                    start_time: '07:00',
                                    arrival_at_school: '07:50'
                                },
                                afternoon: {
                                    type: 'drop',
                                    start_time: '16:15',
                                    end_time: '17:00'
                                }
                            },
                            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                        }
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Group not found'
                    }
                },
                notes: 'Returns complete schedule with school coordination and operating days.',
                order: 9
            },
            {
                title: 'Get price estimate',
                method: 'GET',
                endpoint: '/api/groups/:id/price-estimate',
                description: 'Get price estimate for group membership based on pickup location',
                category: 'Groups',
                requiresAuth: true,
                requestBody: null,
                requestExample: null,
                responseSuccess: {
                    success: true,
                    data: {
                        price_estimate: {
                            group_id: 'group_001',
                            group_name: 'Morning Group A',
                            pickup_location: {
                                address: 'Kezira, House #123'
                            },
                            pricing: {
                                base_price: 2500,
                                distance_km: 3.5,
                                distance_fee: 300,
                                total_price: 2800,
                                currency: 'ETB',
                                billing: 'monthly'
                            }
                        }
                    }
                },
                responseError: {
                    success: false,
                    error: {
                        code: 'CALCULATION_FAILED',
                        message: 'Failed to calculate price estimate'
                    }
                },
                notes: 'Distance-based pricing. Pickup location affects total monthly price.',
                order: 10
            }
        ];
        
        let addedCount = 0;
        let updatedCount = 0;
        
        for (const endpoint of groupsEndpoints) {
            try {
                // Check if endpoint already exists
                const existing = await ApiEndpoint.findOne({
                    method: endpoint.method,
                    endpoint: endpoint.endpoint
                });
                
                if (existing) {
                    // Update existing endpoint
                    await ApiEndpoint.findByIdAndUpdate(existing._id, endpoint, { new: true });
                    console.log(`✅ Updated: ${endpoint.method} ${endpoint.endpoint}`);
                    updatedCount++;
                } else {
                    // Create new endpoint
                    const newEndpoint = new ApiEndpoint(endpoint);
                    await newEndpoint.save();
                    console.log(`✅ Added: ${endpoint.method} ${endpoint.endpoint}`);
                    addedCount++;
                }
            } catch (error) {
                console.error(`❌ Failed to add ${endpoint.method} ${endpoint.endpoint}:`, error.message);
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Added: ${addedCount} new endpoints`);
        console.log(`   ✅ Updated: ${updatedCount} existing endpoints`);
        console.log(`   📚 Total Groups API endpoints: ${groupsEndpoints.length}`);
        
        // Also add Schools endpoints if they don't exist
        console.log(`\n🏫 Checking Schools API endpoints...`);
        
        const schoolsEndpoints = [
            {
                title: 'Get all schools',
                method: 'GET',
                endpoint: '/api/schools',
                description: 'Get all schools with optional filtering by city, type, or search',
                category: 'Schools',
                requiresAuth: true,
                requestBody: null,
                responseSuccess: {
                    success: true,
                    data: {
                        schools: [
                            {
                                _id: 'school_001',
                                name: 'Addis Ababa Primary School',
                                address: { city: 'Addis Ababa' },
                                type: 'primary',
                                isActive: true
                            }
                        ],
                        total: 1
                    }
                },
                order: 1
            },
            {
                title: 'Create school',
                method: 'POST',
                endpoint: '/api/schools',
                description: 'Create a new school with location and contact information',
                category: 'Schools',
                requiresAuth: true,
                requestBody: {
                    name: 'string (required)',
                    latitude: 'number (required)',
                    longitude: 'number (required)',
                    address: 'object (optional)',
                    contactInfo: 'object (optional)',
                    type: 'string (optional)',
                    studentCapacity: 'number (optional)'
                },
                responseSuccess: {
                    success: true,
                    message: 'School created successfully',
                    data: {
                        school: {
                            _id: 'school_001',
                            name: 'Addis Ababa Primary School',
                            latitude: 9.0192,
                            longitude: 38.7525,
                            isActive: true
                        }
                    }
                },
                order: 2
            }
        ];
        
        let schoolsAdded = 0;
        let schoolsUpdated = 0;
        
        for (const endpoint of schoolsEndpoints) {
            try {
                const existing = await ApiEndpoint.findOne({
                    method: endpoint.method,
                    endpoint: endpoint.endpoint
                });
                
                if (existing) {
                    await ApiEndpoint.findByIdAndUpdate(existing._id, endpoint, { new: true });
                    console.log(`✅ Updated: ${endpoint.method} ${endpoint.endpoint}`);
                    schoolsUpdated++;
                } else {
                    const newEndpoint = new ApiEndpoint(endpoint);
                    await newEndpoint.save();
                    console.log(`✅ Added: ${endpoint.method} ${endpoint.endpoint}`);
                    schoolsAdded++;
                }
            } catch (error) {
                console.error(`❌ Failed to add ${endpoint.method} ${endpoint.endpoint}:`, error.message);
            }
        }
        
        console.log(`\n📊 Schools Summary:`);
        console.log(`   ✅ Added: ${schoolsAdded} new endpoints`);
        console.log(`   ✅ Updated: ${schoolsUpdated} existing endpoints`);
        
        // Close connection
        await mongoose.disconnect();
        console.log('\n✅ Database connection closed');
        console.log('\n🎉 Groups and Schools API documentation added successfully!');
        console.log('📖 Visit: http://localhost:3001/admin/api-docs to view the documentation');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.name === 'MongooseServerSelectionError') {
            console.log('\n🔧 MongoDB connection issue:');
            console.log('   1. Check if MongoDB is running');
            console.log('   2. Verify connection string in .env file');
            console.log('   3. Check database name');
        }
        
        process.exit(1);
    }
}

addGroupsApiDocs();
