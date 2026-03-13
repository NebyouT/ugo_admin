// Check what's stored in the database for Google Maps integration
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ugo', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Define a simple schema for the Setting collection
  const settingSchema = new mongoose.Schema({}, { strict: false });
  const Setting = mongoose.model('Setting', settingSchema, 'settings');
  
  // Find Google Maps integration
  Setting.findOne({ keyName: 'google_maps' })
    .then(integration => {
      if (!integration) {
        console.log('❌ Google Maps integration not found in database');
        console.log('   Try initializing defaults first');
      } else {
        console.log('✅ Google Maps integration found:');
        console.log('   Key Name:', integration.keyName);
        console.log('   Settings Type:', integration.settingsType);
        console.log('   Active:', integration.isActive);
        console.log('   Mode:', integration.mode || 'test');
        
        if (integration.value) {
          console.log('   Has Value: Yes');
          console.log('   API Key Length:', integration.value.api_key ? integration.value.api_key.length : 0);
          console.log('   API Key (first 10 chars):', integration.value.api_key ? integration.value.api_key.substring(0, 10) + '...' : 'Not set');
          console.log('   Enable Places:', integration.value.enable_places);
          console.log('   Enable Directions:', integration.value.enable_directions);
          console.log('   Enable Geocoding:', integration.value.enable_geocoding);
        } else {
          console.log('   Has Value: No');
        }
        
        if (integration.liveValues) {
          console.log('   Has Live Values: Yes');
          console.log('   Live API Key Length:', integration.liveValues.api_key ? integration.liveValues.api_key.length : 0);
        }
        
        if (integration.testValues) {
          console.log('   Has Test Values: Yes');
          console.log('   Test API Key Length:', integration.testValues.api_key ? integration.testValues.api_key.length : 0);
        }
      }
      
      // Show all integrations
      console.log('\n📋 All Integrations in Database:');
      return Setting.find({});
    })
    .then(integrations => {
      integrations.forEach((int, i) => {
        console.log(`${i + 1}. ${int.keyName} (${int.settingsType}) - Active: ${int.isActive}`);
      });
      
      mongoose.connection.close();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Database error:', err.message);
      mongoose.connection.close();
      process.exit(1);
    });
})
.catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
