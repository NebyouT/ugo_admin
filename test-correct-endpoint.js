const http = require('http');

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
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      // Test API key extraction like school module
      if (jsonData.success && jsonData.data.integration.value?.api_key) {
        const apiKey = jsonData.data.integration.value.api_key;
        console.log('✅ API Key extracted successfully!');
        console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
        console.log('🗺️ Google Maps should now work in zone creation!');
        console.log('🎯 Zone creation page should load interactive map!');
        console.log('📱 Using same logic as school module!');
      } else {
        console.log('❌ No API key found in integration.value');
        console.log('Available data structure:', Object.keys(jsonData.data.integration || {}));
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
