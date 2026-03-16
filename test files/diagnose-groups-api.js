// Diagnose Groups API issues
const http = require('http');

async function diagnoseGroupsAPI() {
    console.log('=== Diagnosing Groups API Issues ===\n');
    
    try {
        // Test 1: Check if server is running
        console.log('1. Testing server health...');
        const healthOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/health',
            method: 'GET'
        };

        try {
            const healthResponse = await new Promise((resolve, reject) => {
                const req = http.request(healthOptions, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        resolve({
                            statusCode: res.statusCode,
                            data: data
                        });
                    });
                });
                req.on('error', reject);
                req.end();
            });
            
            console.log(`Health Check Status: ${healthResponse.statusCode}`);
            if (healthResponse.statusCode === 200) {
                console.log('✅ Server is running');
            } else {
                console.log('❌ Server health check failed');
                console.log('Response:', healthResponse.data.substring(0, 200));
                return;
            }
        } catch (error) {
            console.log('❌ Server is not running');
            console.log('Error:', error.message);
            console.log('\n🔧 To fix:');
            console.log('   1. Start server: node app.js');
            console.log('   2. Or: npm start');
            return;
        }

        // Test 2: Check if Groups API exists
        console.log('\n2. Testing Groups API endpoint...');
        const groupsOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/groups',
            method: 'GET',
            headers: {
                'Cookie': 'adminAuth=test'
            }
        };

        const groupsResponse = await new Promise((resolve, reject) => {
            const req = http.request(groupsOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            req.on('error', reject);
            req.end();
        });

        console.log(`Groups API Status: ${groupsResponse.statusCode}`);
        
        if (groupsResponse.statusCode === 404) {
            console.log('❌ Groups API not found (404)');
            console.log('This means the route is not registered or server needs restart');
            
            // Check if it's returning HTML (error page)
            if (groupsResponse.data.includes('<!DOCTYPE')) {
                console.log('📄 Server returned HTML (likely error page)');
                console.log('First 200 chars:', groupsResponse.data.substring(0, 200));
            }
            
            console.log('\n🔧 Solutions:');
            console.log('   1. Restart server: node app.js');
            console.log('   2. Check if Groups module is properly imported');
            console.log('   3. Verify route registration in app.js');
            
        } else if (groupsResponse.statusCode === 401) {
            console.log('🔐 Authentication required');
            console.log('This is normal - API exists but needs authentication');
            
        } else if (groupsResponse.statusCode === 200) {
            console.log('✅ Groups API is working');
            try {
                const jsonData = JSON.parse(groupsResponse.data);
                console.log('Response format:', Object.keys(jsonData));
                if (jsonData.success) {
                    console.log(`Found ${jsonData.data?.groups?.length || 0} groups`);
                }
            } catch (e) {
                console.log('Response is not valid JSON');
            }
        }

        // Test 3: Check other API endpoints for comparison
        console.log('\n3. Testing other APIs for comparison...');
        
        const testEndpoints = [
            { path: '/api/schools', name: 'Schools' },
            { path: '/api/users', name: 'Users' },
            { path: '/api/children', name: 'Children' }
        ];

        for (const endpoint of testEndpoints) {
            try {
                const options = {
                    hostname: 'localhost',
                    port: 3001,
                    path: endpoint.path,
                    method: 'GET',
                    headers: {
                        'Cookie': 'adminAuth=test'
                    }
                };

                const response = await new Promise((resolve, reject) => {
                    const req = http.request(options, (res) => {
                        resolve({ statusCode: res.statusCode });
                    });
                    req.on('error', reject);
                    req.end();
                });

                console.log(`${endpoint.name} API: ${response.statusCode}`);
            } catch (error) {
                console.log(`${endpoint.name} API: Error - ${error.message}`);
            }
        }

        // Test 4: Try to create a group (this is what's failing)
        console.log('\n4. Testing group creation (the failing operation)...');
        
        const createOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/groups',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'adminAuth=test'
            }
        };

        const groupData = {
            name: 'Test Group',
            school: '507f1f77bcf86cd799439011', // Dummy school ID
            schedule: {
                pickup_time: '07:00',
                drop_time: '16:30'
            },
            capacity: 8,
            base_price: 2500
        };

        try {
            const createResponse = await new Promise((resolve, reject) => {
                const req = http.request(createOptions, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        resolve({
                            statusCode: res.statusCode,
                            data: data
                        });
                    });
                });
                req.on('error', reject);
                req.write(JSON.stringify(groupData));
                req.end();
            });

            console.log(`Create Group Status: ${createResponse.statusCode}`);
            
            if (createResponse.statusCode === 404) {
                console.log('❌ Create endpoint also not found');
            } else if (createResponse.statusCode === 401) {
                console.log('🔐 Create endpoint exists but needs auth');
            } else {
                console.log('✅ Create endpoint working');
            }

        } catch (error) {
            console.log('Create test failed:', error.message);
        }

    } catch (error) {
        console.error('❌ Diagnosis failed:', error.message);
    }
}

diagnoseGroupsAPI();
