// Debug the groups route and school loading
const http = require('http');

async function debugGroupsRoute() {
    console.log('=== Debugging Groups Route ===\n');
    
    try {
        console.log('1. Testing /admin/groups route...');
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/admin/groups',
            method: 'GET',
            headers: {
                'Cookie': 'adminAuth=test'
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
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

        console.log('Status Code:', response.statusCode);
        
        if (response.statusCode === 302) {
            console.log('Redirect to login detected');
            console.log('Location header:', response.headers.location);
            console.log('\n🔧 Please login first:');
            console.log('   1. Go to: http://localhost:3001/admin/login');
            console.log('   2. Login with admin credentials');
            console.log('   3. Then try accessing groups again');
            return;
        }
        
        if (response.statusCode === 500) {
            console.log('Server error detected');
            console.log('Error details:');
            console.log(response.data.substring(0, 1000) + '...');
            
            // Look for specific error patterns
            if (response.data.includes('schools is not defined')) {
                console.log('\n❌ Confirmed: schools variable is not defined');
                console.log('🔧 Fix: The route needs to properly pass schools variable');
            }
            
            if (response.data.includes('Cannot find module')) {
                console.log('\n❌ Module import error');
                console.log('🔧 Check: School model path is correct');
            }
            
            return;
        }
        
        if (response.statusCode === 200) {
            console.log('✅ Page loaded successfully');
            
            // Check if schools data is in the page
            const pageDataMatch = response.data.match(/window\.pageData\s*=\s*({[^}]+})/);
            if (pageDataMatch) {
                console.log('✅ Found window.pageData in page');
                try {
                    const data = JSON.parse(pageDataMatch[1]);
                    console.log(`✅ Schools count: ${data.schools?.length || 0}`);
                    
                    if (data.schools && data.schools.length > 0) {
                        console.log('Sample schools:');
                        data.schools.slice(0, 3).forEach((school, i) => {
                            console.log(`   ${i + 1}. ${school.name} (${school._id})`);
                        });
                    }
                } catch (e) {
                    console.log('❌ Failed to parse pageData:', e.message);
                }
            } else {
                console.log('❌ No window.pageData found in page');
                console.log('🔧 The EJS template is not properly embedding the data');
            }
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

// Also test if the School model can be imported
async function testSchoolModel() {
    console.log('\n2. Testing School model import...');
    
    try {
        const School = require('../modules/schools/models/School');
        console.log('✅ School model imported successfully');
        
        // Test database connection
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
            console.log('✅ MongoDB connected');
            
            // Try to fetch schools
            const schools = await School.find({ isDeleted: false, isActive: true })
                .select('name address city _id')
                .sort({ name: 1 });
            
            console.log(`✅ Found ${schools.length} schools in database`);
            
            if (schools.length > 0) {
                console.log('Sample schools:');
                schools.slice(0, 3).forEach((school, i) => {
                    console.log(`   ${i + 1}. ${school.name} - ${school.address?.city || 'Unknown'}`);
                });
            }
        } else {
            console.log('❌ MongoDB not connected');
            console.log('🔧 Start the server first: node app.js');
        }
        
    } catch (error) {
        console.log('❌ School model import failed:', error.message);
        console.log('🔧 Check: modules/schools/models/School.js exists');
    }
}

// Run the tests
async function runDebug() {
    await debugGroupsRoute();
    
    // Only test model if server might be running
    try {
        await testSchoolModel();
    } catch (error) {
        console.log('Model test skipped (server not running)');
    }
    
    console.log('\n=== Debug Complete ===');
    console.log('📋 Next steps:');
    console.log('1. Fix any errors identified above');
    console.log('2. Restart server: node app.js');
    console.log('3. Login to admin panel');
    console.log('4. Test groups page: http://localhost:3001/admin/groups');
}

runDebug();
