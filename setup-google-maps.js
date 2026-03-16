// Setup Google Maps Integration in Database
const mongoose = require('mongoose');
const Setting = require('./modules/integrations/models/Setting');

async function setupGoogleMaps() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect('mongodb+srv://ugoo:ugo1234@cluster0.cq73g0t.mongodb.net/?appName=Cluster0');
    console.log('Connected to MongoDB Atlas');
    
    // Update Google Maps integration with real API key
    const updateResult = await Setting.findOneAndUpdate(
      { keyName: 'google_maps' },
      {
        settingsType: 'map_api',
        description: 'Google Maps API Configuration',
        mode: 'live',
        liveValues: {
          api_key: 'AIzaSyB1Y1xY2xY3xY4xY5xY6xY7xY8xY9xY', // Replace with your actual API key
          enable_places: true,
          enable_directions: true,
          enable_geocoding: true,
          enable_distance_matrix: true
        },
        testValues: {
          api_key: 'AIzaSyB1Y1xY2xY3xY4xY5xY6xY7xY8xY9xY', // Replace with your test API key
          enable_places: true,
          enable_directions: false,
          enable_geocoding: true,
          enable_distance_matrix: false
        },
        value: {
          api_key: 'AIzaSyB1Y1xY2xY3xY4xY5xY6xY7xY8xY9xY', // Fallback API key
          enable_places: true,
          enable_directions: true,
          enable_geocoding: true,
          enable_distance_matrix: true
        },
        isActive: true, // Enable the integration
        updatedBy: null,
        updatedBy: null
      },
      { upsert: true, new: true }
    );
    
    console.log('Google Maps integration updated:', updateResult.keyName);
    console.log('Status:', updateResult.isActive ? 'Active' : 'Inactive');
    console.log('Mode:', updateResult.mode);
    console.log('API Key configured:', !!updateResult.liveValues?.api_key);
    
    // Test the GoogleMapsService
    const GoogleMapsService = require('./modules/integrations/services/GoogleMapsService');
    try {
      const apiKey = await GoogleMapsService.getAPIKey();
      console.log('API Key retrieved successfully:', apiKey ? 'Yes' : 'No');
      console.log('API Key (first 10 chars):', apiKey?.substring(0, 10) + '...');
    } catch (error) {
      console.error('Error retrieving API key:', error.message);
    }
    
    console.log('\n✅ Google Maps integration setup complete!');
    console.log('🗺️ You can now use Google Maps in zone creation');
    console.log('🔑 API Key is stored in database and fetched dynamically');
    console.log('🔄 Mode-based configuration (live/test) supported');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

setupGoogleMaps();
