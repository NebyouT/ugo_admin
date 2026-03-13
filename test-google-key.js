// Test Google Maps API key directly
const https = require('https');

async function testGoogleMapsAPIKey() {
  console.log('=== Testing Google Maps API Key ===\n');
  
  try {
    // First, get the API key from our integrations
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/integrations/google_maps',
      method: 'GET',
      headers: {
        'Cookie': 'adminAuth=test' // We'll need to update this after checking
      }
    };

    // We'll use a simple approach - check if server is running and get the key manually
    console.log('1. Checking if server is running...');
    
    // Test Google Maps API with a sample key (you'll need to replace this)
    const testKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your actual key
    
    if (testKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      console.log('❌ Please replace YOUR_GOOGLE_MAPS_API_KEY with your actual API key in this script');
      console.log('\nTo get your API key:');
      console.log('1. Go to Google Cloud Console');
      console.log('2. Enable Google Maps Geocoding API');
      console.log('3. Create API key');
      console.log('4. Copy the key here');
      return;
    }
    
    console.log('2. Testing Google Maps Geocoding API...');
    
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Addis+Ababa&key=${testKey}`;
    
    https.get(testUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          console.log('Response Status:', res.statusCode);
          console.log('Google Maps Status:', result.status);
          
          if (result.status === 'OK') {
            console.log('✅ Google Maps API key is working correctly!');
            console.log('📍 Found', result.results.length, 'locations');
            console.log('📍 Sample location:', result.results[0]?.formatted_address || 'N/A');
            console.log('📍 Coordinates:', result.results[0]?.geometry?.location || 'N/A');
            
            // Test Places API if enabled
            console.log('\n3. Testing Google Maps Places API...');
            const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=9.0192,38.7525&radius=5000&keyword=school&key=${testKey}`;
            
            https.get(placesUrl, (placesRes) => {
              let placesData = '';
              
              placesRes.on('data', (chunk) => {
                placesData += chunk;
              });
              
              placesRes.on('end', () => {
                try {
                  const placesResult = JSON.parse(placesData);
                  console.log('Places API Status:', placesResult.status);
                  
                  if (placesResult.status === 'OK') {
                    console.log('✅ Places API is working!');
                    console.log('📍 Found', placesResult.results.length, 'places near Addis Ababa');
                  } else if (placesResult.status === 'REQUEST_DENIED') {
                    console.log('⚠️ Places API not enabled for this key');
                    console.log('   Enable "Places API" in Google Cloud Console');
                  } else {
                    console.log('❌ Places API error:', placesResult.status);
                  }
                } catch (e) {
                  console.log('Error parsing Places response:', e.message);
                }
              });
            });
            
          } else if (result.status === 'REQUEST_DENIED') {
            console.log('❌ Google Maps API key is invalid or has restrictions');
            console.log('🔑 Error:', result.error_message || 'Check API key permissions');
            console.log('\n📋 Common issues:');
            console.log('   - API key is incorrect');
            console.log('   - API key is restricted to specific websites');
            console.log('   - Geocoding API is not enabled');
            console.log('   - Billing is not set up');
          } else if (result.status === 'ZERO_RESULTS') {
            console.log('⚠️ No results found (but API key works)');
            console.log('   This might be normal for some addresses');
          } else {
            console.log('❌ Unexpected status:', result.status);
            console.log('🔧 Error:', result.error_message || 'Unknown error');
          }
        } catch (e) {
          console.log('❌ Error parsing response:', e.message);
        }
      });
    }).on('error', (e) => {
      console.log('❌ Network error:', e.message);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGoogleMapsAPIKey();
