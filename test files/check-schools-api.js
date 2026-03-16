// Check schools via API (when server is running)
const http = require('http');

async function checkSchoolsViaAPI() {
    console.log('=== Checking Schools via API ===\n');
    
    try {
        // First try to get schools without authentication (might work for GET)
        console.log('1. Testing /api/schools endpoint...');
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/schools',
            method: 'GET'
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({
                            statusCode: res.statusCode,
                            data: JSON.parse(data)
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            data: data
                        });
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });

        console.log('API Status:', response.statusCode);
        
        if (response.statusCode === 200 && response.data.success) {
            const schools = response.data.data?.schools || [];
            console.log(`✅ Found ${schools.length} schools via API`);
            
            if (schools.length > 0) {
                console.log('\n📋 Schools list:');
                schools.forEach((school, i) => {
                    const status = school.isActive ? '✅' : '🔴';
                    const location = school.address?.city || school.address?.region || 'Unknown';
                    console.log(`   ${i + 1}. ${status} ${school.name} - ${location}`);
                });
                
                // Count by status
                const activeCount = schools.filter(s => s.isActive).length;
                const inactiveCount = schools.filter(s => !s.isActive).length;
                
                console.log('\n📊 Summary:');
                console.log(`   Total: ${schools.length}`);
                console.log(`   Active: ${activeCount}`);
                console.log(`   Inactive: ${inactiveCount}`);
            } else {
                console.log('\n❌ No schools found in database');
                console.log('💡 To add schools:');
                console.log('   1. Start server: node app.js');
                console.log('   2. Go to: http://localhost:3001/admin/login');
                console.log('   3. Login to admin panel');
                console.log('   4. Go to: http://localhost:3001/admin/schools');
                console.log('   5. Click "Add School"');
            }
        } else if (response.statusCode === 401) {
            console.log('🔐 Authentication required');
            console.log('   Need to be logged in to access schools API');
            
            // Try with test authentication
            console.log('\n2. Trying with test authentication...');
            const authOptions = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/schools',
                method: 'GET',
                headers: {
                    'Cookie': 'adminAuth=test'
                }
            };

            const authResponse = await new Promise((resolve, reject) => {
                const req = http.request(authOptions, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve({
                                statusCode: res.statusCode,
                                data: JSON.parse(data)
                            });
                        } catch (e) {
                            resolve({
                                statusCode: res.statusCode,
                                data: data
                            });
                        }
                    });
                });
                req.on('error', reject);
                req.end();
            });

            console.log('Auth API Status:', authResponse.statusCode);
            
            if (authResponse.statusCode === 200 && authResponse.data.success) {
                const schools = authResponse.data.data?.schools || [];
                console.log(`✅ Found ${schools.length} schools with auth`);
                
                if (schools.length > 0) {
                    schools.forEach((school, i) => {
                        const status = school.isActive ? '✅' : '🔴';
                        const location = school.address?.city || school.address?.region || 'Unknown';
                        console.log(`   ${i + 1}. ${status} ${school.name} - ${location}`);
                    });
                }
            } else {
                console.log('❌ Still failed with auth');
                console.log('   Please login to admin panel first');
            }
        } else {
            console.log('❌ API call failed');
            console.log('Status:', response.statusCode);
            console.log('Response:', response.data);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n🔧 Make sure:');
        console.log('   1. Server is running: node app.js');
        console.log('   2. MongoDB is connected');
        console.log('   3. Try logging into admin panel first');
    }
}

checkSchoolsViaAPI();
