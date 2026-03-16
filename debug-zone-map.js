const http = require('http');

// Test the Google Maps API endpoint
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/integrations/google_maps',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`=== Google Maps API Endpoint Test ===`);
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      
      if (res.statusCode === 200 && jsonData.success) {
        console.log('✅ API Endpoint Working!');
        console.log('Response Structure:');
        console.log('- success:', jsonData.success);
        console.log('- data.integration exists:', !!jsonData.data.integration);
        
        if (jsonData.data.integration) {
          console.log('- integration.keyName:', jsonData.data.integration.keyName);
          console.log('- integration.isActive:', jsonData.data.integration.isActive);
          console.log('- integration.mode:', jsonData.data.integration.mode);
          console.log('- integration.value.api_key exists:', !!jsonData.data.integration.value?.api_key);
          
          if (jsonData.data.integration.value?.api_key) {
            const apiKey = jsonData.data.integration.value.api_key;
            console.log('✅ API Key Found!');
            console.log('- API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
            console.log('- API Key length:', apiKey.length);
            
            // Check if it's a test key
            if (apiKey.includes('Dummy') || apiKey.includes('test') || apiKey.length < 30) {
              console.log('⚠️  Using Test/Dummy API Key');
            } else {
              console.log('✅ Using Real Google Maps API Key');
            }
            
            console.log('\n🎯 Expected Results:');
            console.log('- Zone creation page should load interactive map');
            console.log('- Drawing tools should be available');
            console.log('- Search box should work with Google Places');
            console.log('- No InvalidKeyMapError should appear');
            
          } else {
            console.log('❌ No API Key Found in integration.value');
            console.log('Available paths:', Object.keys(jsonData.data.integration));
          }
        }
      } else {
        console.log('❌ API Endpoint Failed:');
        console.log('- Status:', res.statusCode);
        console.log('- Response:', jsonData);
      }
    } catch (error) {
      console.log('❌ JSON Parse Error:');
      console.log('Raw Response:', data);
      console.error('Error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure server is running: npm start');
  console.log('2. Check if server is on port 3001');
  console.log('3. Verify Google Maps integration is active in database');
});

req.end();

console.log('🔍 Testing Google Maps API integration for zone creation...');
console.log('📍 Endpoint: http://localhost:3001/api/integrations/google_maps');
console.log('⏳ Waiting for response...\n');
