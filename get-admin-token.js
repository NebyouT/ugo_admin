const http = require('http');

// Login to get a valid JWT token
const loginData = JSON.stringify({
  email: 'admin@ugo.com',
  password: '12345678'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Login Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Login Response:');
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (jsonData.success && jsonData.data.token) {
        const token = jsonData.data.token;
        console.log('✅ JWT Token obtained!');
        console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
        
        // Now test the Google Maps API endpoint with the valid token
        testGoogleMapsAPI(token);
      } else {
        console.log('❌ No token in login response');
      }
    } catch (error) {
      console.log('Raw Response:', data);
      console.error('JSON Parse Error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Login Error:', error.message);
});

req.write(loginData);
req.end();

function testGoogleMapsAPI(token) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/integrations/google-maps',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nGoogle Maps API Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Google Maps API Response:');
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
    console.error('Google Maps API Error:', error.message);
  });

  req.end();
}
