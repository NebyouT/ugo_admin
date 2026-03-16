// Test Groups API endpoints
const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test all Groups API endpoints
async function testGroupsAPI() {
    console.log('=== Testing Groups API Endpoints ===\n');
    
    const baseUrl = 'localhost';
    const port = 3001;
    let createdGroupId = null;
    let schoolId = null;

    try {
        // First, get a school ID (required for groups)
        console.log('1. Getting a school for testing...');
        const schoolsOptions = {
            hostname: baseUrl,
            port: port,
            path: '/api/schools',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'adminAuth=test' // Using test auth
            }
        };

        const schoolsResponse = await makeRequest(schoolsOptions);
        console.log('Schools API Status:', schoolsResponse.statusCode);
        
        if (schoolsResponse.data.success && schoolsResponse.data.data.items.length > 0) {
            schoolId = schoolsResponse.data.data.items[0]._id;
            console.log('Using school:', schoolsResponse.data.data.items[0].name);
        } else {
            console.log('❌ No schools found. Please create a school first.');
            return;
        }

        // Test 1: POST /groups/search - Search Groups
        console.log('\n2. Testing POST /groups/search...');
        const searchOptions = {
            hostname: baseUrl,
            port: port,
            path: '/api/groups/search',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'adminAuth=test'
            }
        };

        const searchData = {
            school_id: schoolId,
            pickup_location: {
                address: 'Kezira, House #123',
                lat: 9.6000,
                lng: 41.8500
            },
            preferred_time: '07:00'
        };

        const searchResponse = await makeRequest(searchOptions, searchData);
        console.log('Search API Status:', searchResponse.statusCode);
        console.log('Search Response:', JSON.stringify(searchResponse.data, null, 2));

        // Test 2: GET /groups - Get All Groups
        console.log('\n3. Testing GET /groups...');
        const getAllOptions = {
            hostname: baseUrl,
            port: port,
            path: '/api/groups',
            method: 'GET',
            headers: {
                'Cookie': 'adminAuth=test'
            }
        };

        const getAllResponse = await makeRequest(getAllOptions);
        console.log('Get All API Status:', getAllResponse.statusCode);
        console.log('Get All Response:', JSON.stringify(getAllResponse.data, null, 2));

        // Test 3: POST /groups - Create a Group (for testing other endpoints)
        console.log('\n4. Testing POST /groups (Create Group)...');
        const createOptions = {
            hostname: baseUrl,
            port: port,
            path: '/api/groups',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'adminAuth=test'
            }
        };

        const createData = {
            name: 'Test Group - Morning A',
            school: schoolId,
            schedule: {
                pickup_time: '07:00',
                drop_time: '16:30'
            },
            capacity: 8,
            base_price: 2500
        };

        const createResponse = await makeRequest(createOptions, createData);
        console.log('Create API Status:', createResponse.statusCode);
        console.log('Create Response:', JSON.stringify(createResponse.data, null, 2));

        if (createResponse.data.success) {
            createdGroupId = createResponse.data.data.group._id;
            console.log('Created group ID:', createdGroupId);
        }

        // Test 4: GET /groups/{id} - Get Group Detail
        if (createdGroupId) {
            console.log('\n5. Testing GET /groups/{id}...');
            const getOneOptions = {
                hostname: baseUrl,
                port: port,
                path: `/api/groups/${createdGroupId}`,
                method: 'GET',
                headers: {
                    'Cookie': 'adminAuth=test'
                }
            };

            const getOneResponse = await makeRequest(getOneOptions);
            console.log('Get One API Status:', getOneResponse.statusCode);
            console.log('Get One Response:', JSON.stringify(getOneResponse.data, null, 2));

            // Test 5: GET /groups/{id}/driver - Get Group Driver Info
            console.log('\n6. Testing GET /groups/{id}/driver...');
            const driverOptions = {
                hostname: baseUrl,
                port: port,
                path: `/api/groups/${createdGroupId}/driver`,
                method: 'GET',
                headers: {
                    'Cookie': 'adminAuth=test'
                }
            };

            const driverResponse = await makeRequest(driverOptions);
            console.log('Driver API Status:', driverResponse.statusCode);
            console.log('Driver Response:', JSON.stringify(driverResponse.data, null, 2));

            // Test 6: GET /groups/{id}/availability - Check Spots Available
            console.log('\n7. Testing GET /groups/{id}/availability...');
            const availabilityOptions = {
                hostname: baseUrl,
                port: port,
                path: `/api/groups/${createdGroupId}/availability`,
                method: 'GET',
                headers: {
                    'Cookie': 'adminAuth=test'
                }
            };

            const availabilityResponse = await makeRequest(availabilityOptions);
            console.log('Availability API Status:', availabilityResponse.statusCode);
            console.log('Availability Response:', JSON.stringify(availabilityResponse.data, null, 2));

            // Test 7: GET /groups/{id}/schedule - Get Pickup/Drop Schedule
            console.log('\n8. Testing GET /groups/{id}/schedule...');
            const scheduleOptions = {
                hostname: baseUrl,
                port: port,
                path: `/api/groups/${createdGroupId}/schedule`,
                method: 'GET',
                headers: {
                    'Cookie': 'adminAuth=test'
                }
            };

            const scheduleResponse = await makeRequest(scheduleOptions);
            console.log('Schedule API Status:', scheduleResponse.statusCode);
            console.log('Schedule Response:', JSON.stringify(scheduleResponse.data, null, 2));

            // Test 8: GET /groups/{id}/price-estimate - Get Price for Location
            console.log('\n9. Testing GET /groups/{id}/price-estimate...');
            const priceOptions = {
                hostname: baseUrl,
                port: port,
                path: `/api/groups/${createdGroupId}/price-estimate?address=Kezira, House #123&lat=9.6000&lng=41.8500`,
                method: 'GET',
                headers: {
                    'Cookie': 'adminAuth=test'
                }
            };

            const priceResponse = await makeRequest(priceOptions);
            console.log('Price Estimate API Status:', priceResponse.statusCode);
            console.log('Price Estimate Response:', JSON.stringify(priceResponse.data, null, 2));

            // Test 9: DELETE /groups/{id} - Delete Group (cleanup)
            console.log('\n10. Testing DELETE /groups/{id} (cleanup)...');
            const deleteOptions = {
                hostname: baseUrl,
                port: port,
                path: `/api/groups/${createdGroupId}`,
                method: 'DELETE',
                headers: {
                    'Cookie': 'adminAuth=test'
                }
            };

            const deleteResponse = await makeRequest(deleteOptions);
            console.log('Delete API Status:', deleteResponse.statusCode);
            console.log('Delete Response:', JSON.stringify(deleteResponse.data, null, 2));
        }

        console.log('\n=== Groups API Testing Complete ===');
        console.log('✅ All endpoints tested');
        console.log('📝 Check the responses above for any errors');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Make sure:');
        console.log('   1. Server is running: node app.js');
        console.log('   2. MongoDB is connected');
        console.log('   3. At least one school exists in the database');
        console.log('   4. You are logged in to the admin panel');
    }
}

// Run the tests
testGroupsAPI();
