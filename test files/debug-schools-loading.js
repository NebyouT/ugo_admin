// Debug school loading issue
const http = require('http');

async function debugSchoolsAPI() {
    console.log('=== Debugging Schools Loading Issue ===\n');
    
    try {
        // Test 1: Check if schools API is working
        console.log('1. Testing /api/schools endpoint...');
        const schoolsOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/schools',
            method: 'GET',
            headers: {
                'Cookie': 'adminAuth=test'
            }
        };

        const schoolsResponse = await new Promise((resolve, reject) => {
            const req = http.request(schoolsOptions, (res) => {
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

        console.log('Status Code:', schoolsResponse.statusCode);
        console.log('Response:', JSON.stringify(schoolsResponse.data, null, 2));

        if (schoolsResponse.statusCode === 401) {
            console.log('\n❌ Authentication issue detected!');
            console.log('🔧 Fix needed: The API requires proper authentication');
            console.log('   Try logging into admin panel first: http://localhost:3001/admin/login');
            return;
        }

        if (!schoolsResponse.data.success) {
            console.log('\n❌ Schools API returned error:', schoolsResponse.data.error?.message);
            return;
        }

        console.log(`\n✅ Schools API working! Found ${schoolsResponse.data.data.items.length} schools`);

        // Test 2: Check if we can access the admin page
        console.log('\n2. Testing admin groups page...');
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
                        data: data.substring(0, 500) + '...' // First 500 chars
                    });
                });
            });
            req.on('error', reject);
            req.end();
        });

        console.log('Admin Page Status:', adminResponse.statusCode);
        
        if (adminResponse.statusCode === 200) {
            console.log('✅ Admin page accessible');
        } else if (adminResponse.statusCode === 302) {
            console.log('⚠️ Admin page redirects to login (need proper auth)');
        }

        // Test 3: Create a simple HTML test
        console.log('\n3. Creating test HTML for manual testing...');
        const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>School Loading Test</title>
    <script>
    async function testSchools() {
        console.log('Testing schools API...');
        try {
            const res = await fetch('/api/schools', { credentials: 'include' });
            const data = await res.json();
            console.log('Response:', data);
            
            if (data.success) {
                const select = document.getElementById('schoolSelect');
                select.innerHTML = '<option value="">Select School</option>' + 
                    data.data.items.map(school => {
                        const location = school.address?.city || school.address?.region || 'Unknown';
                        return \`<option value="\${school._id}">\${school.name} - \${location}</option>\`;
                    }).join('');
                console.log('Schools loaded successfully!');
            } else {
                console.error('Failed to load schools:', data.error?.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
    </script>
</head>
<body>
    <h1>School Loading Test</h1>
    <button onclick="testSchools()">Load Schools</button>
    <select id="schoolSelect">
        <option>Loading...</option>
    </select>
    <div id="output"></div>
</body>
</html>
        `;

        require('fs').writeFileSync('test-schools-loading.html', testHTML);
        console.log('✅ Created test-schools-loading.html');
        console.log('   Open this file in your browser to test school loading');

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugSchoolsAPI();
