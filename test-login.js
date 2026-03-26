const http = require('http');

// Test login
const testData = {
  phone: '+251911234567',
  password: 'TestPassword123'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing Login API...');
console.log('📝 Test data:', JSON.stringify(testData, null, 2));

const req = http.request(options, (res) => {
  console.log(`\n📊 Status Code: ${res.statusCode}`);
  
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
        console.log('\n✅ Login API working!');
        if (result.data.tokens) {
          console.log('🔑 Access Token:', result.data.tokens.access_token ? 'Generated' : 'Not provided');
          console.log('🔄 Refresh Token:', result.data.tokens.refresh_token ? 'Generated' : 'Not provided');
          console.log('⏰ Expires In:', result.data.tokens.expires_in || 'Not provided');
        }
        if (result.data.user) {
          console.log('👤 User ID:', result.data.user.id);
          console.log('📱 User Phone:', result.data.user.phone);
          console.log('👔 User Type:', result.data.user.user_type);
          console.log('📊 User Status:', result.data.user.status);
        }
      } else {
        console.log('\n❌ Login failed');
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
