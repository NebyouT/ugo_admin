const http = require('http');

// Test OTP verification
const testData = {
  phone: '+251911234567',
  otp: '123456', // Hardcoded OTP from the system
  purpose: 'registration'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/verify-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing OTP Verification API...');
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
        console.log('\n✅ OTP Verification API working!');
        if (result.data.tokens) {
          console.log('🔑 Access Token:', result.data.tokens.access ? 'Generated' : 'Not provided');
          console.log('🔄 Refresh Token:', result.data.tokens.refresh ? 'Generated' : 'Not provided');
        }
        if (result.data.user) {
          console.log('👤 User ID:', result.data.user._id);
          console.log('📧 User Email:', result.data.user.email);
          console.log('📱 User Phone:', result.data.user.phone);
          console.log('👔 User Type:', result.data.user.userType);
        }
      } else {
        console.log('\n❌ OTP Verification failed');
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
