// Debug script to check integrations
const http = require('http');

// Test if integrations exist
const testIntegrations = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/integrations',
    method: 'GET',
    headers: {
      'Cookie': 'adminAuth=test' // Try with a test cookie
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Integrations API Response:');
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Success:', parsed.success);
        if (parsed.success) {
          console.log('Total integrations:', parsed.data.total);
          parsed.data.integrations.forEach((int, i) => {
            console.log(`${i + 1}. ${int.keyName} (${int.settingsType}) - Active: ${int.isActive}`);
          });
        } else {
          console.log('Error:', parsed.error?.message);
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.end();
};

// Test specific integration
const testGoogleMaps = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/integrations/google_maps',
    method: 'GET',
    headers: {
      'Cookie': 'adminAuth=test'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\nGoogle Maps Integration Response:');
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Success:', parsed.success);
        if (parsed.success) {
          console.log('Integration:', parsed.data.integration.keyName);
          console.log('Active:', parsed.data.integration.isActive);
          console.log('Has API Key:', !!parsed.data.integration.value?.api_key);
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.end();
};

// Test the test endpoint
const testGoogleMapsTest = () => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/integrations/google_maps/test',
    method: 'POST',
    headers: {
      'Cookie': 'adminAuth=test',
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('\nGoogle Maps Test Response:');
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Success:', parsed.success);
        console.log('Message:', parsed.message);
        if (parsed.success) {
          console.log('Test Status:', parsed.data.status);
          console.log('Test Message:', parsed.data.message);
        }
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e.message);
  });

  req.end();
};

console.log('=== Debugging Integrations ===');
testIntegrations();
setTimeout(testGoogleMaps, 1000);
setTimeout(testGoogleMapsTest, 2000);
