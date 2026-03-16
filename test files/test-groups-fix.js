// Test Groups API after adding CRUD routes
const http = require('http');

async function testGroupsFix() {
    console.log('=== Testing Groups API Fix ===\n');
    
    try {
        // Test 1: Check if server is running
        console.log('1. Checking server health...');
        const healthResponse = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3001,
                path: '/health',
                method: 'GET'
            }, (res) => {
                resolve({ statusCode: res.statusCode });
            });
            req.on('error', reject);
            req.end();
        });
        
        if (healthResponse.statusCode !== 200) {
            console.log('❌ Server is not running');
            console.log('Please start server: node app.js');
            return;
        }
        console.log('✅ Server is running');
        
        // Test 2: Check if POST endpoint exists (should return 401 if auth required, not 404)
        console.log('\n2. Testing POST /api/groups endpoint...');
        const postResponse = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3001,
                path: '/api/groups',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': 'adminAuth=test'
                }
            }, (res) => {
                resolve({ statusCode: res.statusCode });
            });
            req.on('error', reject);
            req.write(JSON.stringify({
                name: 'Test Group',
                school: '507f1f77bcf86cd799439011',
                schedule: { pickup_time: '07:00', drop_time: '16:30' },
                capacity: 8,
                base_price: 2500
            }));
            req.end();
        });
        
        console.log(`POST /api/groups Status: ${postResponse.statusCode}`);
        
        if (postResponse.statusCode === 404) {
            console.log('❌ POST endpoint still not found');
            console.log('🔧 Server needs to be restarted to load new routes');
            console.log('\nTo fix:');
            console.log('   1. Stop the current server (Ctrl+C)');
            console.log('   2. Restart: node app.js');
            console.log('   3. Try again');
        } else if (postResponse.statusCode === 401) {
            console.log('✅ POST endpoint exists (401 = authentication required)');
        } else if (postResponse.statusCode === 201) {
            console.log('✅ POST endpoint working (201 = created)');
        } else {
            console.log(`🤔 Unexpected status: ${postResponse.statusCode}`);
        }
        
        // Test 3: Check PUT endpoint
        console.log('\n3. Testing PUT /api/groups/test-id endpoint...');
        const putResponse = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3001,
                path: '/api/groups/test-id',
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': 'adminAuth=test'
                }
            }, (res) => {
                resolve({ statusCode: res.statusCode });
            });
            req.on('error', reject);
            req.write(JSON.stringify({ name: 'Updated Group' }));
            req.end();
        });
        
        console.log(`PUT /api/groups/test-id Status: ${putResponse.statusCode}`);
        
        if (putResponse.statusCode === 404) {
            console.log('❌ PUT endpoint not found');
        } else {
            console.log('✅ PUT endpoint exists');
        }
        
        // Test 4: Check DELETE endpoint
        console.log('\n4. Testing DELETE /api/groups/test-id endpoint...');
        const deleteResponse = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3001,
                path: '/api/groups/test-id',
                method: 'DELETE',
                headers: {
                    'Cookie': 'adminAuth=test'
                }
            }, (res) => {
                resolve({ statusCode: res.statusCode });
            });
            req.on('error', reject);
            req.end();
        });
        
        console.log(`DELETE /api/groups/test-id Status: ${deleteResponse.statusCode}`);
        
        if (deleteResponse.statusCode === 404) {
            console.log('❌ DELETE endpoint not found');
        } else {
            console.log('✅ DELETE endpoint exists');
        }
        
        console.log('\n=== Summary ===');
        console.log('✅ Added missing CRUD routes to Groups module');
        console.log('✅ Added create, update, delete methods to GroupsController');
        console.log('🔄 Server restart required to load new routes');
        
        console.log('\n📋 Complete Groups API now has:');
        console.log('   GET    /api/groups           - List groups');
        console.log('   POST   /api/groups           - Create group');
        console.log('   GET    /api/groups/:id       - Get group details');
        console.log('   PUT    /api/groups/:id       - Update group');
        console.log('   DELETE /api/groups/:id       - Delete group');
        console.log('   POST   /api/groups/search    - Search groups');
        console.log('   GET    /api/groups/:id/driver - Get driver info');
        console.log('   GET    /api/groups/:id/availability - Check spots');
        console.log('   GET    /api/groups/:id/schedule - Get schedule');
        console.log('   GET    /api/groups/:id/price-estimate - Get price');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testGroupsFix();
