// Helper script to verify server restart and Groups API
const http = require('http');
const { spawn } = require('child_process');

async function checkGroupsAPI() {
    console.log('=== Checking Groups API After Restart ===\n');
    
    try {
        // Test if Groups POST endpoint exists
        console.log('Testing POST /api/groups endpoint...');
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
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        data: data.substring(0, 200)
                    });
                });
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
        
        console.log(`Status: ${postResponse.statusCode}`);
        
        if (postResponse.statusCode === 404) {
            console.log('❌ POST endpoint still returns 404');
            console.log('📄 Response preview:', postResponse.data);
            console.log('\n🔧 SERVER RESTART NEEDED!');
            console.log('Please follow these steps:');
            console.log('1. Stop the current server (Ctrl+C in the terminal where server is running)');
            console.log('2. Restart with: node app.js');
            console.log('3. Wait for server to fully start');
            console.log('4. Try creating a group again');
            
            console.log('\n⚠️  The server is still running the old version without the new CRUD routes.');
            console.log('   The new routes I added will only load after a restart.');
            
        } else if (postResponse.statusCode === 401) {
            console.log('✅ POST endpoint exists! (401 = authentication required)');
            console.log('   This means the server has been restarted and new routes are loaded.');
            console.log('   Now the Groups creation should work in the admin panel.');
            
        } else if (postResponse.statusCode === 201) {
            console.log('✅ POST endpoint working! (201 = group created)');
            console.log('   Groups API is fully functional!');
            
        } else {
            console.log(`🤔 Unexpected status: ${postResponse.statusCode}`);
            console.log('Response:', postResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
        console.log('\n🔧 Make sure server is running: node app.js');
    }
}

// Instructions for manual restart
console.log('=== Groups API Fix Instructions ===\n');
console.log('The Groups API has been fixed with missing CRUD routes.');
console.log('However, the server needs to be restarted to load the new routes.\n');

console.log('📋 Step-by-step instructions:');
console.log('1. Find the terminal where the server is running');
console.log('2. Press Ctrl+C to stop the server');
console.log('3. Run: node app.js');
console.log('4. Wait for: "Server running on port 3001"');
console.log('5. Try creating a group in the admin panel\n');

console.log('🔍 Let me check if the server has been restarted...\n');

checkGroupsAPI();
