// Test Google Maps API key integration with Schools module

async function testGoogleMapsIntegration() {
  console.log('\n=== Testing Google Maps API Integration ===\n');
  
  try {
    // 1. Test if Google Maps integration exists
    console.log('1. Checking Google Maps integration...');
    const response = await fetch('http://localhost:3001/api/integrations/google_maps', {
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      const integration = result.data.integration;
      console.log('✅ Google Maps integration found');
      console.log('   - Key:', integration.keyName);
      console.log('   - Active:', integration.isActive);
      console.log('   - Has API Key:', !!integration.value?.api_key);
      
      if (integration.value?.api_key) {
        console.log('   - API Key (first 10 chars):', integration.value.api_key.substring(0, 10) + '...');
        
        // 2. Test if API key is valid by testing Google Maps API
        console.log('\n2. Testing Google Maps API key validity...');
        const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Addis+Ababa&key=${integration.value.api_key}`;
        
        try {
          const geoResponse = await fetch(testUrl);
          const geoResult = await geoResponse.json();
          
          if (geoResult.status === 'OK') {
            console.log('✅ Google Maps API key is valid');
            console.log('   - Geocoding works for Addis Ababa');
            console.log('   - Found', geoResult.results.length, 'locations');
          } else if (geoResult.status === 'REQUEST_DENIED') {
            console.log('❌ Google Maps API key is invalid or restricted');
            console.log('   - Error:', geoResult.error_message || 'API key issue');
          } else {
            console.log('⚠️ Google Maps API returned status:', geoResult.status);
          }
        } catch (error) {
          console.log('❌ Failed to test Google Maps API:', error.message);
        }
      } else {
        console.log('❌ No API key configured');
        console.log('   Please add an API key in the Google Maps integration');
      }
      
      // 3. Test Schools API
      console.log('\n3. Testing Schools API...');
      const schoolsResponse = await fetch('http://localhost:3001/api/schools', {
        credentials: 'include'
      });
      
      const schoolsResult = await schoolsResponse.json();
      
      if (schoolsResult.success) {
        console.log('✅ Schools API is working');
        console.log('   - Found', schoolsResult.data.total, 'schools');
      } else {
        console.log('❌ Schools API failed:', schoolsResult.error?.message);
      }
      
      // 4. Test creating a school with coordinates
      console.log('\n4. Testing school creation with coordinates...');
      const schoolData = {
        name: 'Test School for Maps',
        latitude: 9.0192,
        longitude: 38.7525,
        address: {
          street: 'Bole Road',
          city: 'Addis Ababa',
          country: 'Ethiopia'
        },
        type: 'primary',
        grades: {
          from: 'Grade 1',
          to: 'Grade 8'
        },
        studentCapacity: 500,
        description: 'Test school for Google Maps integration'
      };
      
      const createResponse = await fetch('http://localhost:3001/api/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(schoolData)
      });
      
      const createResult = await createResponse.json();
      
      if (createResult.success) {
        console.log('✅ School created successfully');
        console.log('   - School ID:', createResult.data.school._id);
        console.log('   - Coordinates:', createResult.data.school.latitude, createResult.data.school.longitude);
        
        // Clean up - delete the test school
        await fetch(`http://localhost:3001/api/schools/${createResult.data.school._id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        console.log('   - Test school cleaned up');
      } else {
        console.log('❌ School creation failed:', createResult.error?.message);
      }
      
    } else {
      console.log('❌ Google Maps integration not found');
      console.log('   - Please initialize defaults in Integrations first');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n=== Test Complete ===\n');
}

// Run the test
testGoogleMapsIntegration();
