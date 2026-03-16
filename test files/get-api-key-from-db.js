// Get Google Maps API key from database
const mongoose = require('mongoose');

// Connect to MongoDB using the same connection as your app
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Define the Setting schema (same as in your app)
  const settingSchema = new mongoose.Schema({
    keyName: String,
    settingsType: String,
    value: mongoose.Schema.Types.Mixed,
    liveValues: mongoose.Schema.Types.Mixed,
    testValues: mongoose.Schema.Types.Mixed,
    mode: String,
    isActive: Boolean,
    description: String,
    additionalData: mongoose.Schema.Types.Mixed
  }, { timestamps: true });
  
  const Setting = mongoose.model('Setting', settingSchema, 'settings');
  
  // Find Google Maps integration
  Setting.findOne({ keyName: 'google_maps' })
    .then(integration => {
      if (!integration) {
        console.log('❌ Google Maps integration not found');
        console.log('   Available integrations:');
        
        // List all integrations
        return Setting.find({}).select('keyName settingsType isActive');
      }
      
      console.log('✅ Google Maps integration found:');
      console.log('   Key Name:', integration.keyName);
      console.log('   Settings Type:', integration.settingsType);
      console.log('   Active:', integration.isActive);
      console.log('   Mode:', integration.mode || 'test');
      console.log('   Description:', integration.description || 'No description');
      
      // Get the API key based on mode
      let apiKey = null;
      if (integration.mode === 'live' && integration.liveValues) {
        apiKey = integration.liveValues.api_key;
        console.log('   Using Live Values');
      } else if (integration.testValues) {
        apiKey = integration.testValues.api_key;
        console.log('   Using Test Values');
      } else if (integration.value) {
        apiKey = integration.value.api_key;
        console.log('   Using Value');
      }
      
      if (apiKey) {
        console.log('\n🔑 Google Maps API Key:');
        console.log('   Length:', apiKey.length);
        console.log('   First 10 chars:', apiKey.substring(0, 10) + '...');
        console.log('   Last 10 chars:', '...' + apiKey.substring(apiKey.length - 10));
        console.log('   Full Key:', apiKey); // Show full key for testing
        
        // Test the API key immediately
        testGoogleMapsAPI(apiKey);
        
      } else {
        console.log('\n❌ No API key found in integration');
        console.log('   Please add an API key to the Google Maps integration');
      }
      
      // Show the full integration object for debugging
      console.log('\n📋 Full Integration Data:');
      console.log(JSON.stringify(integration.toObject(), null, 2));
      
      return Setting.find({}).select('keyName settingsType isActive');
    })
    .then(allIntegrations => {
      console.log('\n📋 All Integrations in Database:');
      allIntegrations.forEach((int, i) => {
        console.log(`${i + 1}. ${int.keyName} (${int.settingsType}) - Active: ${int.isActive}`);
      });
      
      mongoose.connection.close();
    })
    .catch(err => {
      console.error('❌ Database error:', err.message);
      mongoose.connection.close();
    });
})
.catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  console.log('\n🔧 Make sure MongoDB is running and the connection string is correct');
  console.log('   Check your .env file for MONGODB_URI');
});

// Test Google Maps API with the retrieved key
function testGoogleMapsAPI(apiKey) {
  const https = require('https');
  
  console.log('\n🧪 Testing Google Maps API with retrieved key...');
  
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
          console.log('✅ SUCCESS! Google Maps API key is working correctly!');
          console.log('📍 Found', result.results.length, 'locations');
          
          if (result.results.length > 0) {
            const location = result.results[0];
            console.log('📍 Location:', location.formatted_address);
            console.log('📍 Coordinates:', location.geometry?.location);
          }
        } else if (result.status === 'REQUEST_DENIED') {
          console.log('❌ FAILED! Google Maps API key issue:');
          console.log('🔑 Error:', result.error_message || 'Invalid API key or restrictions');
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
