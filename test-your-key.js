// Test your specific Google Maps API key
const https = require('https');

const YOUR_API_KEY = "AIzaSyBxOv1W4MJkfVHPk7cccICUTBAJ-WdZ2pA";

function testGoogleMapsAPI() {
  console.log('=== Testing Your Google Maps API Key ===\n');
  console.log('🔑 API Key:', YOUR_API_KEY);
  console.log('🔑 Length:', YOUR_API_KEY.length);
  console.log('🔑 First 10 chars:', YOUR_API_KEY.substring(0, 10) + '...');
  console.log('🔑 Last 10 chars:', '...' + YOUR_API_KEY.substring(YOUR_API_KEY.length - 10));
  console.log('\n');
  
  // Test 1: Geocoding API
  console.log('📍 Test 1: Geocoding API (Addis Ababa)');
  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Addis+Ababa,Ethiopia&key=${YOUR_API_KEY}`;
  
  https.get(geoUrl, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        console.log('   Status Code:', res.statusCode);
        console.log('   Google Status:', result.status);
        
        if (result.status === 'OK') {
          console.log('   ✅ SUCCESS! Geocoding API works');
          console.log('   📍 Found', result.results.length, 'locations');
          
          if (result.results.length > 0) {
            const location = result.results[0];
            console.log('   📍 Address:', location.formatted_address);
            console.log('   📍 Coordinates:', location.geometry?.location);
          }
          
          // Test 2: Places API
          console.log('\n🏪 Test 2: Places API (nearby schools)');
          testPlacesAPI();
          
        } else if (result.status === 'REQUEST_DENIED') {
          console.log('   ❌ FAILED! Geocoding API issue:');
          console.log('   🔑 Error:', result.error_message || 'Invalid API key or restrictions');
          console.log('\n   🔧 Common fixes:');
          console.log('      1. Enable "Google Maps Geocoding API" in Google Cloud Console');
          console.log('      2. Enable billing for your project');
          console.log('      3. Check API key restrictions');
          
        } else {
          console.log('   ⚠️ Unexpected status:', result.status);
          console.log('   Error:', result.error_message || 'Unknown error');
        }
      } catch (e) {
        console.log('   ❌ Error parsing response:', e.message);
      }
    });
  }).on('error', (e) => {
    console.log('   ❌ Network error:', e.message);
  });
}

function testPlacesAPI() {
  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=9.0192,38.7525&radius=5000&keyword=school&key=${YOUR_API_KEY}`;
  
  https.get(placesUrl, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        
        console.log('   Status Code:', res.statusCode);
        console.log('   Places Status:', result.status);
        
        if (result.status === 'OK') {
          console.log('   ✅ SUCCESS! Places API works');
          console.log('   🏫 Found', result.results.length, 'schools nearby');
          
          if (result.results.length > 0) {
            console.log('   🏫 Sample school:', result.results[0].name);
            console.log('   📍 Location:', result.results[0].vicinity);
          }
          
          console.log('\n🎉 CONCLUSION: Your Google Maps API key is working perfectly!');
          console.log('   ✅ Geocoding API: Working');
          console.log('   ✅ Places API: Working');
          console.log('   🚀 Ready to use with UGO Schools module');
          
        } else if (result.status === 'REQUEST_DENIED') {
          console.log('   ⚠️ Places API not enabled');
          console.log('   🔑 Error:', result.error_message || 'API key restrictions');
          console.log('\n   🔧 To fix:');
          console.log('      1. Go to Google Cloud Console');
          console.log('      2. Enable "Places API"');
          console.log('      3. Geocoding will still work for Schools module');
          
        } else {
          console.log('   ⚠️ Places API error:', result.status);
        }
      } catch (e) {
        console.log('   ❌ Error parsing Places response:', e.message);
      }
    });
  }).on('error', (e) => {
    console.log('   ❌ Network error:', e.message);
  });
}

testGoogleMapsAPI();
