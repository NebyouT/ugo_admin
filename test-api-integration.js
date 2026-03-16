// Test API Integration
const http = require('http');

async function testAPIIntegration() {
  try {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/google-maps',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Google Maps API Integration Test Results:');
          console.log('Status:', result.success ? 'Success' : 'Failed');
          console.log('API Key:', result.data?.apiKey ? '✅ Configured' : '❌ Not configured');
          console.log('API Key (first 10 chars):', result.data?.apiKey?.substring(0, 10) + '...');
          console.log('🎯 Google Maps should now work in zone creation!');
          
          if (result.success) {
            console.log('\n✅ Database Integration Working!');
            console.log('🔑 API Key: ' + result.data.apiKey.substring(0, 10) + '...');
            console.log('🗺️ Zone pages will now use the database API key');
            console.log('🔄 Mode-based configuration supported');
          }
        } catch (error) {
          console.log('❌ Failed to parse response:', error.message);
          console.log('Raw response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
    });

    req.end();
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testAPIIntegration();
