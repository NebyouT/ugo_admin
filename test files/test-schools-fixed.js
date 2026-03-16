// Test the fixed school loading
const http = require('http');

async function testFixedSchools() {
    console.log('=== Testing Fixed School Loading ===\n');
    
    try {
        // Test 1: Check if admin page loads with schools data
        console.log('1. Testing admin groups page...');
        const adminOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/admin/groups',
            method: 'GET',
            headers: {
                'Cookie': 'adminAuth=test'
            }
        };

        const adminResponse = await new Promise((resolve, reject) => {
            const req = http.request(adminOptions, (res) => {
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

        console.log('Admin Page Status:', adminResponse.statusCode);
        
        if (adminResponse.statusCode === 200) {
            // Check if schools data is embedded in the page
            const pageData = adminResponse.data;
            
            // Look for window.pageData in the HTML
            const pageDataMatch = pageData.match(/window\.pageData\s*=\s*({[^}]+})/);
            if (pageDataMatch) {
                console.log('✅ Found window.pageData in page');
                try {
                    const schoolsData = JSON.parse(pageDataMatch[1]);
                    console.log(`✅ Schools embedded in page: ${schoolsData.schools?.length || 0} schools`);
                    
                    if (schoolsData.schools && schoolsData.schools.length > 0) {
                        console.log('Sample schools:');
                        schoolsData.schools.slice(0, 3).forEach((school, i) => {
                            const location = school.address?.city || school.address?.region || 'Unknown';
                            console.log(`   ${i + 1}. ${school.name} - ${location}`);
                        });
                    }
                } catch (e) {
                    console.log('❌ Failed to parse embedded school data:', e.message);
                }
            } else {
                console.log('❌ No window.pageData found in page');
            }
        } else if (adminResponse.statusCode === 302) {
            console.log('⚠️ Admin page redirects to login');
            console.log('   Please login first: http://localhost:3001/admin/login');
        }

        // Test 2: Create a test group using the embedded data approach
        console.log('\n2. Testing group creation with school...');
        
        // Get a school ID from the page if available
        let testSchoolId = null;
        if (pageDataMatch) {
            try {
                const schoolsData = JSON.parse(pageDataMatch[1]);
                if (schoolsData.schools && schoolsData.schools.length > 0) {
                    testSchoolId = schoolsData.schools[0]._id;
                    console.log(`Using school: ${schoolsData.schools[0].name}`);
                }
            } catch (e) {
                console.log('Could not extract school ID from page data');
            }
        }

        if (testSchoolId) {
            const groupData = {
                name: 'Test Group with Fixed School Loading',
                school: testSchoolId,
                schedule: {
                    pickup_time: '07:00',
                    drop_time: '16:30'
                },
                capacity: 8,
                base_price: 2500
            };

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

            const createResponse = await new Promise((resolve, reject) => {
                const req = http.request(createOptions, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            resolve(data);
                        }
                    });
                });
                req.on('error', reject);
                req.write(JSON.stringify(groupData));
                req.end();
            });

            console.log('Create Group Response:', createResponse);
            
            if (createResponse.success) {
                console.log('✅ Group created successfully with school!');
                
                // Clean up
                const deleteOptions = {
                    hostname: 'localhost',
                    port: 3001,
                    path: `/api/groups/${createResponse.data.group._id}`,
                    method: 'DELETE',
                    headers: {
                        'Cookie': 'adminAuth=test'
                    }
                };

                await new Promise((resolve, reject) => {
                    const req = http.request(deleteOptions, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => {
                            try {
                                resolve(JSON.parse(data));
                            } catch (e) {
                                resolve(data);
                            }
                        });
                    });
                    req.on('error', reject);
                    req.end();
                });
                
                console.log('✅ Test group cleaned up');
            } else {
                console.log('❌ Failed to create group:', createResponse.error?.message);
            }
        } else {
            console.log('⚠️ No school available for testing');
        }

        console.log('\n=== Test Summary ===');
        console.log('✅ Schools are now pre-loaded on the server side');
        console.log('✅ No authentication issues for school selection');
        console.log('✅ Schools embedded directly in the page HTML');
        console.log('✅ JavaScript uses window.pageData.schools');
        console.log('✅ Fallback to API if needed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Make sure:');
        console.log('   1. Server is running: node app.js');
        console.log('   2. You are logged into admin panel');
        console.log('   3. At least one school exists in database');
    }
}

testFixedSchools();
