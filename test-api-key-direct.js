// Test your Google Maps API key directly
const https = require('https');

// Replace this with your actual Google Maps API key
const YOUR_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

function testGoogleMapsAPI() {
  console.log('=== Testing Google Maps API Key Directly ===\n');
  
  if (YOUR_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    console.log('❌ Please replace YOUR_GOOGLE_MAPS_API_KEY_HERE with your actual API key');
    console.log('\nTo get your API key:');
    console.log('1. Go to: https://console.cloud.google.com/');
    console.log('2. Select your project');
    console.log('3. Go to APIs & Services > Library');
    console.log('4. Enable "Google Maps Geocoding API"');
    console.log('5. Go to Credentials');
    console.log('6. Create API key');
    console.log('7. Copy the key and replace it in this script\n');
    return;
  }
  
  console.log('🔑 Testing with API key:', YOUR_API_KEY.substring(0, 10) + '...');
  console.log('📍 Testing geocoding for "Addis Ababa, Ethiopia"...\n');
  
  const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Addis+Ababa,Ethiopia&key=${YOUR_API_KEY}`;
  
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
          console.log('\n✅ SUCCESS! Google Maps API key is working correctly!');
          console.log('📍 Found', result.results.length, 'locations');
          
          if (result.results.length > 0) {
            const location = result.results[0];
            console.log('\n📍 Location Details:');
            console.log('   Name:', location.formatted_address);
            console.log('   Coordinates:', location.geometry?.location);
            console.log('   Types:', location.types.join(', '));
            
            if (location.geometry?.location) {
              console.log('   Latitude:', location.geometry.location.lat);
              console.log('   Longitude:', location.geometry.location.lng);
            }
          }
          
          // Test Places API
          console.log('\n🏪 Testing Places API (nearby schools)...');
          const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=9.0192,38.7525&radius=5000&keyword=school&key=${YOUR_API_KEY}`;
          
          https.get(placesUrl, (placesRes) => {
            let placesData = '';
            
            placesRes.on('data', (chunk) => {
              placesData += chunk;
            });
            
            placesRes.on('end', () => {
              try {
                const placesResult = JSON.parse(placesData);
                console.log('🏪 Places API Status:', placesResult.status);
                
                if (placesResult.status === 'OK') {
                  console.log('✅ Places API is working!');
                  console.log('🏫 Found', placesResult.results.length, 'schools nearby');
                } else if (placesResult.status === 'REQUEST_DENIED') {
                  console.log('⚠️ Places API not enabled');
                  console.log('   Enable "Places API" in Google Cloud Console for this key');
                } else {
                  console.log('❌ Places API error:', placesResult.status);
                  if (placesResult.error_message) {
                    console.log('   Error:', placesResult.error_message);
                  }
                }
              } catch (e) {
                console.log('Error parsing Places response:', e.message);
              }
            });
          });
          
        } else if (result.status === 'REQUEST_DENIED') {
          console.log('\n❌ FAILED! Google Maps API key issue:');
          console.log('🔑 Error:', result.error_message || 'Invalid API key or restrictions');
          
          console.log('\n🔧 Common fixes:');
          console.log('1. Check if the API key is correct');
          console.log('2. Enable "Google Maps Geocoding API" in Google Cloud Console');
          console.log('3. Make sure billing is enabled for your project');
          console.log('4. Check if API key has website restrictions');
          console.log('5. Verify API key is not restricted to specific APIs');
          
        } else if (result.status === 'ZERO_RESULTS') {
          console.log('\n⚠️ No results found (but API key works)');
          console.log('   This might be normal for some test addresses');
          
        } else {
          console.log('\n❌ Unexpected error:');
          console.log('Status:', result.status);
          console.log('Error:', result.error_message || 'Unknown error');
        }
        
      } catch (e) {
        console.log('❌ Error parsing response:', e.message);
      }
    });
  }).on('error', (e) => {
    console.log('❌ Network error:', e.message);
  });
}

testGoogleMapsAPI();
