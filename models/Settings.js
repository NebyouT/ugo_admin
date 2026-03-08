const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  googleMaps: {
    apiKey: {
      type: String,
      required: false,
      select: false // Don't include in queries by default for security
    },
    enableGeocoding: {
      type: Boolean,
      default: false
    },
    enablePlaces: {
      type: Boolean,
      default: false
    },
    enableMaps: {
      type: Boolean,
      default: false
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  // Add other integration settings here in the future
  paymentGateways: {
    telebirr: {
      apiKey: String,
      merchantId: String,
      enabled: Boolean
    },
    mPesa: {
      apiKey: String,
      merchantId: String,
      enabled: Boolean
    }
  },
  emailService: {
    provider: {
      type: String,
      enum: ['gmail', 'outlook', 'custom']
    },
    settings: {
      host: String,
      port: Number,
      secure: Boolean,
      auth: {
        user: String,
        pass: String
      }
    }
  },
  smsService: {
    provider: {
      type: String,
      enum: ['twilio', 'custom']
    },
    apiKey: String,
    phoneNumber: String
  }
}, {
  timestamps: true
});

// Static method to get Google Maps configuration
settingsSchema.statics.getGoogleMapsConfig = async function() {
  const settings = await this.findOne({}, { 'googleMaps.apiKey': 1 }).select('+googleMaps.apiKey googleMaps.enableGeocoding googleMaps.enablePlaces googleMaps.enableMaps googleMaps.updatedAt');
  
  if (!settings || !settings.googleMaps) {
    return {
      hasApiKey: false,
      apiKey: null,
      enableGeocoding: false,
      enablePlaces: false,
      enableMaps: false,
      lastUpdated: null
    };
  }
  
  return {
    hasApiKey: !!settings.googleMaps.apiKey,
    apiKey: settings.googleMaps.apiKey,
    enableGeocoding: settings.googleMaps.enableGeocoding,
    enablePlaces: settings.googleMaps.enablePlaces,
    enableMaps: settings.googleMaps.enableMaps,
    lastUpdated: settings.googleMaps.updatedAt
  };
};

// Static method to save Google Maps configuration
settingsSchema.statics.saveGoogleMapsConfig = async function(config, userId) {
  let settings = await this.findOne();
  
  if (!settings) {
    // Create new settings document
    settings = new this({
      googleMaps: {
        ...config,
        updatedBy: userId,
        updatedAt: new Date()
      }
    });
  } else {
    // Update existing settings
    if (!settings.googleMaps) {
      settings.googleMaps = {};
    }
    
    settings.googleMaps = {
      ...settings.googleMaps,
      ...config,
      updatedBy: userId,
      updatedAt: new Date()
    };
  }
  
  await settings.save();
  return settings;
};

// Static method to get Google Maps API key
settingsSchema.statics.getGoogleMapsApiKey = async function() {
  const config = await this.getGoogleMapsConfig();
  return config.apiKey;
};

// Static method to test Google Maps API key
settingsSchema.statics.testGoogleMapsApiKey = async function(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required for testing');
  }
  
  try {
    const testAddress = 'Addis Ababa, Ethiopia';
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`;
    
    const response = await fetch(geocodingUrl);
    const data = await response.json();
    
    if (data.status === 'OK') {
      return {
        success: true,
        testLocation: {
          address: testAddress,
          coordinates: data.results[0].geometry.location,
          formattedAddress: data.results[0].formatted_address
        }
      };
    } else {
      throw new Error('Invalid API key or request failed');
    }
  } catch (error) {
    throw new Error(`Google Maps API test failed: ${error.message}`);
  }
};

// Static method to geocode address
settingsSchema.statics.geocodeAddress = async function(address) {
  const config = await this.getGoogleMapsConfig();
  
  if (!config.hasApiKey) {
    throw new Error('Google Maps API is not configured');
  }
  
  if (!config.enableGeocoding) {
    throw new Error('Geocoding is not enabled');
  }
  
  try {
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.apiKey}`;
    
    const response = await fetch(geocodingUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return {
        success: true,
        coordinates: data.results[0].geometry.location,
        formattedAddress: data.results[0].formatted_address,
        addressComponents: data.results[0].address_components
      };
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    throw new Error(`Geocoding failed: ${error.message}`);
  }
};

// Static method to reverse geocode
settingsSchema.statics.reverseGeocode = async function(lat, lng) {
  const config = await this.getGoogleMapsConfig();
  
  if (!config.hasApiKey) {
    throw new Error('Google Maps API is not configured');
  }
  
  try {
    const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${config.apiKey}`;
    
    const response = await fetch(reverseUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return {
        success: true,
        address: data.results[0].formatted_address,
        addressComponents: data.results[0].address_components
      };
    } else {
      throw new Error('Location not found');
    }
  } catch (error) {
    throw new Error(`Reverse geocoding failed: ${error.message}`);
  }
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
