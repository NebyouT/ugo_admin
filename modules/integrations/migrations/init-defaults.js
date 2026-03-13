const Setting = require('../models/Setting');

async function initializeDefaultIntegrations() {
  try {
    console.log('Initializing default integrations...');
    
    const defaults = [
      {
        keyName: 'google_maps',
        settingsType: 'map_api',
        description: 'Google Maps API for geolocation, directions, and geocoding',
        value: {
          api_key: '',
          enable_places: true,
          enable_directions: true,
          enable_geocoding: true,
          enable_distance_matrix: true
        },
        isActive: false
      },
      {
        keyName: 'afro_sms',
        settingsType: 'sms_gateway',
        description: 'Afro SMS Gateway for Ethiopia',
        value: {
          api_key: '',
          sender_id: 'UGO',
          api_url: 'https://api.afrosms.com/send'
        },
        isActive: false
      },
      {
        keyName: 'firebase_fcm',
        settingsType: 'push_notification',
        description: 'Firebase Cloud Messaging for push notifications',
        value: {
          server_key: '',
          sender_id: '',
          project_id: ''
        },
        isActive: false
      },
      {
        keyName: 'stripe',
        settingsType: 'payment_gateway',
        description: 'Stripe Payment Gateway',
        liveValues: {
          publishable_key: '',
          secret_key: '',
          webhook_secret: ''
        },
        testValues: {
          publishable_key: '',
          secret_key: '',
          webhook_secret: ''
        },
        mode: 'test',
        isActive: false
      }
    ];
    
    for (const def of defaults) {
      await Setting.findOneAndUpdate(
        { keyName: def.keyName },
        def,
        { upsert: true, new: true }
      );
    }
    
    console.log('✓ Default integrations initialized successfully');
  } catch (error) {
    console.error('Failed to initialize default integrations:', error);
  }
}

module.exports = initializeDefaultIntegrations;
