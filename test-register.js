const http = require('http');

// Test data
const testData = {
  user_type: 'parent',
  full_name: 'Test User',
  phone: '+251911234567',
  password: 'TestPassword123',
  confirm_password: 'TestPassword123',
  device_info: {
    platform: 'web',
    version: '1.0.0'
  }
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing Register API...');
console.log('📝 Test data:', JSON.stringify(testData, null, 2));

const req = http.request(options, (res) => {
  console.log(`\n📊 Status Code: ${res.statusCode}`);
  console.log('📋 Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('\n📦 Response Body:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n✅ Registration API working!');
      } else {
        console.log('\n❌ Registration failed');
        if (result.error) {
          console.log('   Error Code:', result.error.code || 'No code');
          console.log('   Error Message:', result.error.message || 'No message');
        }
      }
    } catch (error) {
      console.log('\n❌ Failed to parse response:');
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();
