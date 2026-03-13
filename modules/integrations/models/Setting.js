const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  keyName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  settingsType: {
    type: String,
    required: true,
    enum: ['sms_gateway', 'map_api', 'payment_gateway', 'push_notification', 'email_config', 'storage', 'other'],
    index: true
  },
  
  // For simple key-value settings
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // For gateway settings with live/test modes
  liveValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  testValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  mode: {
    type: String,
    enum: ['live', 'test'],
    default: 'test'
  },
  
  isActive: {
    type: Boolean,
    default: false
  },
  
  additionalData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  description: {
    type: String,
    default: ''
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
settingSchema.index({ settingsType: 1, isActive: 1 });

// Static methods
settingSchema.statics.getByKey = async function(keyName) {
  return await this.findOne({ keyName });
};

settingSchema.statics.getByType = async function(settingsType) {
  return await this.find({ settingsType, isActive: true });
};

settingSchema.statics.getValue = async function(keyName) {
  const setting = await this.findOne({ keyName });
  if (!setting) return null;
  
  // If it has live/test values, return based on mode
  if (setting.liveValues || setting.testValues) {
    return setting.mode === 'live' ? setting.liveValues : setting.testValues;
  }
  
  return setting.value;
};

settingSchema.statics.setValue = async function(keyName, value, userId = null) {
  const update = { value, updatedBy: userId };
  return await this.findOneAndUpdate(
    { keyName },
    update,
    { new: true, upsert: true }
  );
};

// Predefined integration types
settingSchema.statics.INTEGRATION_TYPES = {
  // SMS Gateways
  AFRO_SMS: {
    keyName: 'afro_sms',
    settingsType: 'sms_gateway',
    description: 'Afro SMS Gateway for Ethiopia',
    fields: ['api_key', 'sender_id', 'api_url']
  },
  TWILIO: {
    keyName: 'twilio',
    settingsType: 'sms_gateway',
    description: 'Twilio SMS Gateway',
    fields: ['account_sid', 'auth_token', 'phone_number']
  },
  
  // Map APIs
  GOOGLE_MAPS: {
    keyName: 'google_maps',
    settingsType: 'map_api',
    description: 'Google Maps API for geolocation and routing',
    fields: ['api_key', 'enable_places', 'enable_directions', 'enable_geocoding']
  },
  
  // Push Notifications
  FIREBASE: {
    keyName: 'firebase_fcm',
    settingsType: 'push_notification',
    description: 'Firebase Cloud Messaging',
    fields: ['server_key', 'sender_id', 'project_id']
  },
  
  // Payment Gateways
  STRIPE: {
    keyName: 'stripe',
    settingsType: 'payment_gateway',
    description: 'Stripe Payment Gateway',
    fields: ['publishable_key', 'secret_key', 'webhook_secret']
  },
  PAYPAL: {
    keyName: 'paypal',
    settingsType: 'payment_gateway',
    description: 'PayPal Payment Gateway',
    fields: ['client_id', 'client_secret', 'mode']
  },
  
  // Email
  SMTP: {
    keyName: 'smtp_email',
    settingsType: 'email_config',
    description: 'SMTP Email Configuration',
    fields: ['host', 'port', 'username', 'password', 'from_email', 'from_name']
  },
  
  // Storage
  AWS_S3: {
    keyName: 'aws_s3',
    settingsType: 'storage',
    description: 'AWS S3 Storage',
    fields: ['access_key_id', 'secret_access_key', 'region', 'bucket']
  }
};

// Initialize default settings
settingSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      keyName: 'google_maps',
      settingsType: 'map_api',
      description: 'Google Maps API Configuration',
      value: {
        api_key: '',
        enable_places: true,
        enable_directions: true,
        enable_geocoding: true
      },
      isActive: false
    },
    {
      keyName: 'afro_sms',
      settingsType: 'sms_gateway',
      description: 'Afro SMS Gateway',
      value: {
        api_key: '',
        sender_id: '',
        api_url: 'https://api.afrosms.com/send'
      },
      isActive: false
    },
    {
      keyName: 'firebase_fcm',
      settingsType: 'push_notification',
      description: 'Firebase Cloud Messaging',
      value: {
        server_key: '',
        sender_id: '',
        project_id: ''
      },
      isActive: false
    }
  ];
  
  for (const def of defaults) {
    await this.findOneAndUpdate(
      { keyName: def.keyName },
      def,
      { upsert: true, new: true }
    );
  }
};

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
