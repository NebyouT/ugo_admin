// Get Google Maps API key via the API (no direct DB access needed)
const http = require('http');

// First, let's try to get the API key through the server
function getAPIKeyViaServer() {
  console.log('=== Getting Google Maps API Key via Server ===\n');
  
  // Try to get the integration without authentication first
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
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      
      try {
        const result = JSON.parse(data);
        
        if (res.status === 401) {
          console.log('❌ Authentication required');
          console.log('   The server requires authentication to access the API');
          console.log('   Please log in to the admin panel first');
          console.log('   Then use the browser to check the integration');
          
          // Show manual instructions
          showManualInstructions();
          
        } else if (result.success && result.data.integration) {
          const integration = result.data.integration;
          console.log('✅ Google Maps integration found:');
          console.log('   Key Name:', integration.keyName);
          console.log('   Active:', integration.isActive);
          console.log('   Mode:', integration.mode || 'test');
          
          // Get the API key
          let apiKey = null;
          if (integration.mode === 'live' && integration.liveValues) {
            apiKey = integration.liveValues.api_key;
          } else if (integration.testValues) {
            apiKey = integration.testValues.api_key;
          } else if (integration.value) {
            apiKey = integration.value.api_key;
          }
          
          if (apiKey) {
            console.log('\n🔑 Google Maps API Key:');
            console.log('   Length:', apiKey.length);
            console.log('   First 10 chars:', apiKey.substring(0, 10) + '...');
            console.log('   Full Key:', apiKey);
            
            // Test it
            testGoogleMapsAPI(apiKey);
          } else {
            console.log('\n❌ No API key found in integration');
          }
          
        } else {
          console.log('❌ Failed to get integration');
          console.log('   Error:', result.error?.message || 'Unknown error');
        }
      } catch (e) {
        console.log('❌ Error parsing response:', e.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
    console.log('\n🔧 Make sure the server is running on port 3001');
    console.log('   Run: node app.js');
    
    showManualInstructions();
  });

  req.end();
}

function showManualInstructions() {
  console.log('\n📋 Manual Instructions to Get Your API Key:');
  console.log('1. Open your browser');
  console.log('2. Go to: http://localhost:3001/admin/login');
  console.log('3. Login with admin credentials');
  console.log('4. Go to: http://localhost:3001/admin/integrations');
  console.log('5. Find "Google Maps API" in the list');
  console.log('6. Click the Edit button');
  console.log('7. Copy the API key from the JSON field');
  console.log('8. The key should be in this format:');
  console.log('   {"api_key": "YOUR_KEY_HERE", ...}');
  
  console.log('\n🧪 Once you have the key, test it with:');
  console.log('1. Edit test-api-key-direct.js');
  console.log('2. Replace YOUR_GOOGLE_MAPS_API_KEY_HERE with your key');
  console.log('3. Run: node test-api-key-direct.js');
}

// Test Google Maps API
function testGoogleMapsAPI(apiKey) {
  const https = require('https');
  
  console.log('\n🧪 Testing Google Maps API...');
  
  const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Addis+Ababa,Ethiopia&key=${apiKey}`;
  
  https.get(testUrl, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        console.log('📊 Response Status:', res.statusCode);
        console.log('🔍 Google Maps Status:', result.status);
        
        if (result.status === 'OK') {
          console.log('✅ SUCCESS! Your Google Maps API key is working correctly!');
          console.log('📍 Found', result.results.length, 'locations');
          
          if (result.results.length > 0) {
            const location = result.results[0];
            console.log('📍 Location:', location.formatted_address);
            console.log('📍 Coordinates:', location.geometry?.location);
          }
        } else if (result.status === 'REQUEST_DENIED') {
          console.log('❌ FAILED! Google Maps API key issue:');
          console.log('🔑 Error:', result.error_message || 'Invalid API key or restrictions');
          console.log('\n🔧 Common fixes:');
          console.log('   - Enable "Google Maps Geocoding API" in Google Cloud Console');
          console.log('   - Enable billing for your project');
          console.log('   - Check API key restrictions');
        } else {
          console.log('⚠️ Unexpected status:', result.status);
        }
      } catch (e) {
        console.log('❌ Error parsing response:', e.message);
      }
    });
  }).on('error', (e) => {
    console.log('❌ Network error:', e.message);
  });
}

getAPIKeyViaServer();
