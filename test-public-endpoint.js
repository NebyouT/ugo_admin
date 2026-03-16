const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/integrations/google-maps/public',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      // Test API key extraction
      if (jsonData.success && jsonData.data.integration) {
        const integration = jsonData.data.integration;
        let apiKey = null;
        
        if (integration.mode === 'live' && integration.liveValues) {
          apiKey = integration.liveValues.api_key;
        } else if (integration.testValues) {
          apiKey = integration.testValues.api_key;
        } else if (integration.value) {
          apiKey = integration.value.api_key;
        }
        
        if (apiKey) {
          console.log('✅ API Key extracted successfully!');
          console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
          console.log('🗺️ Google Maps should now work in zone creation!');
          console.log('🎯 Zone creation page should load interactive map!');
        } else {
          console.log('❌ No API key found in integration data');
        }
      } else {
        console.log('❌ Invalid response format');
      }
    } catch (error) {
      console.log('Raw Response:', data);
      console.error('JSON Parse Error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error.message);
});

req.end();
