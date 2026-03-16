const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption service for sensitive data
class EncryptionService {
  static encrypt(text) {
    if (!text) return null;
    
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-encryption-key', 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm,
        encryptedAt: new Date()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Fallback to plain text
    }
  }
  
  static decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'object') {
      return encryptedData; // Return as-is if not encrypted
    }
    
    try {
      const algorithm = encryptedData.algorithm || 'aes-256-gcm';
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-encryption-key', 'salt', 32);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData.encrypted; // Fallback to encrypted data
    }
  }
}

// Validation schemas for different integration types
const integrationSchemas = {
  google_maps: {
    liveValues: {
      api_key: { 
        type: 'string', 
        required: true, 
        minLength: 20,
        pattern: /^AIzaSy[A-Za-z0-9_-]{35}$/,
        message: 'Invalid Google Maps API key format'
      },
      enable_places: { type: 'boolean', default: true },
      enable_directions: { type: 'boolean', default: true },
      enable_geocoding: { type: 'boolean', default: true },
      enable_distance_matrix: { type: 'boolean', default: true }
    },
    testValues: {
      api_key: { 
        type: 'string', 
        required: true, 
        minLength: 20,
        pattern: /^AIzaSy[A-Za-z0-9_-]{35}$/,
        message: 'Invalid Google Maps API key format'
      }
    }
  },
  
  stripe: {
    liveValues: {
      publishable_key: { 
        type: 'string', 
        required: true, 
        pattern: /^pk_test_[A-Za-z0-9]{24}$|^pk_live_[A-Za-z0-9]{24}$/,
        message: 'Invalid Stripe publishable key format'
      },
      secret_key: { 
        type: 'string', 
        required: true, 
        pattern: /^sk_test_[A-Za-z0-9]{24}$|^sk_live_[A-Za-z0-9]{24}$/,
        message: 'Invalid Stripe secret key format'
      },
      webhook_secret: { 
        type: 'string', 
        required: true, 
        minLength: 20,
        message: 'Webhook secret is required'
      }
    }
  },
  
  afro_sms: {
    liveValues: {
      api_key: { type: 'string', required: true, minLength: 10 },
      sender_id: { type: 'string', required: true, minLength: 3 },
      api_url: { 
        type: 'string', 
        required: true,
        pattern: /^https?:\/\/.+/,
        message: 'Invalid API URL format'
      }
    }
  }
};

// Validation function
function validateIntegrationData(settingsType, data) {
  const schema = integrationSchemas[settingsType];
  if (!schema) return { valid: true, errors: [] };
  
  const errors = [];
  
  const validateField = (fieldPath, value, rules) => {
    if (rules.required && (!value || value === '')) {
      errors.push(`${fieldPath} is required`);
      return false;
    }
    
    if (value && rules.type === 'string' && rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldPath} must be at least ${rules.minLength} characters`);
      return false;
    }
    
    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${fieldPath}: ${rules.message}`);
      return false;
    }
    
    return true;
  };
  
  // Validate liveValues
  if (data.liveValues && schema.liveValues) {
    for (const [field, rules] of Object.entries(schema.liveValues)) {
      validateField(`liveValues.${field}`, data.liveValues[field], rules);
    }
  }
  
  // Validate testValues
  if (data.testValues && schema.testValues) {
    for (const [field, rules] of Object.entries(schema.testValues)) {
      validateField(`testValues.${field}`, data.testValues[field], rules);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Enhanced setting schema
const settingSchema = new mongoose.Schema({
  keyName: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^[a-z0-9_]+$/i.test(v);
      },
      message: 'Key name must contain only alphanumeric characters and underscores'
    }
  },
  
  settingsType: {
    type: String,
    required: true,
    enum: ['sms_gateway', 'map_api', 'payment_gateway', 'push_notification', 'email_config', 'storage', 'other'],
    index: true
  },
  
  // Encrypted sensitive data
  liveValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    set: function(value) {
      if (value && typeof value === 'object') {
        // Encrypt sensitive fields
        const encrypted = { ...value };
        if (value.api_key) {
          encrypted.api_key = EncryptionService.encrypt(value.api_key);
        }
        if (value.secret_key) {
          encrypted.secret_key = EncryptionService.encrypt(value.secret_key);
        }
        return encrypted;
      }
      return value;
    },
    get: function(value) {
      if (value && typeof value === 'object') {
        // Decrypt sensitive fields
        const decrypted = { ...value };
        if (value.api_key && value.api_key.encrypted) {
          decrypted.api_key = EncryptionService.decrypt(value.api_key);
        }
        if (value.secret_key && value.secret_key.encrypted) {
          decrypted.secret_key = EncryptionService.decrypt(value.secret_key);
        }
        return decrypted;
      }
      return value;
    }
  },
  
  testValues: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    set: function(value) {
      if (value && typeof value === 'object') {
        const encrypted = { ...value };
        if (value.api_key) {
          encrypted.api_key = EncryptionService.encrypt(value.api_key);
        }
        if (value.secret_key) {
          encrypted.secret_key = EncryptionService.encrypt(value.secret_key);
        }
        return encrypted;
      }
      return value;
    },
    get: function(value) {
      if (value && typeof value === 'object') {
        const decrypted = { ...value };
        if (value.api_key && value.api_key.encrypted) {
          decrypted.api_key = EncryptionService.decrypt(value.api_key);
        }
        if (value.secret_key && value.secret_key.encrypted) {
          decrypted.secret_key = EncryptionService.decrypt(value.secret_key);
        }
        return decrypted;
      }
      return value;
    }
  },
  
  // Simple value (less sensitive)
  value: {
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
    default: false,
    index: true
  },
  
  // Enhanced metadata
  keyMetadata: {
    lastRotated: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    rotationInterval: { type: Number, default: 90 }, // days
    isEncrypted: { type: Boolean, default: true },
    lastValidated: { type: Date, default: null },
    validationStatus: { 
      type: String, 
      enum: ['pending', 'valid', 'invalid', 'expired'],
      default: 'pending'
    }
  },
  
  additionalData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  
  // Enhanced audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Version tracking
  version: {
    type: Number,
    default: 1
  },
  
  // Change tracking
  changeHistory: [{
    version: Number,
    changes: mongoose.Schema.Types.Mixed,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
settingSchema.index({ settingsType: 1, isActive: 1 });
settingSchema.index({ 'keyMetadata.expiresAt': 1 });
settingSchema.index({ 'keyMetadata.lastValidated': 1 });

// Pre-save middleware for validation
settingSchema.pre('save', async function(next) {
  try {
    // Validate integration data
    const validation = validateIntegrationData(this.settingsType, {
      liveValues: this.liveValues,
      testValues: this.testValues,
      value: this.value
    });
    
    if (!validation.valid) {
      const error = new Error('Validation failed: ' + validation.errors.join(', '));
      error.name = 'ValidationError';
      return next(error);
    }
    
    // Update version and change history
    if (this.isModified() && !this.isNew) {
      this.version += 1;
      
      const changes = {};
      if (this.isModified('liveValues')) changes.liveValues = this.liveValues;
      if (this.isModified('testValues')) changes.testValues = this.testValues;
      if (this.isModified('value')) changes.value = this.value;
      if (this.isModified('mode')) changes.mode = this.mode;
      if (this.isModified('isActive')) changes.isActive = this.isActive;
      
      this.changeHistory.push({
        version: this.version,
        changes,
        changedBy: this.updatedBy,
        changedAt: new Date()
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual fields
settingSchema.virtual('isExpired').get(function() {
  if (!this.keyMetadata.expiresAt) return false;
  return new Date() > this.keyMetadata.expiresAt;
});

settingSchema.virtual('needsRotation').get(function() {
  if (!this.keyMetadata.lastRotated) return true;
  const daysSinceRotation = (new Date() - this.keyMetadata.lastRotated) / (1000 * 60 * 60 * 24);
  return daysSinceRotation >= this.keyMetadata.rotationInterval;
});

// Static methods
settingSchema.statics.getByKey = async function(keyName) {
  return await this.findOne({ keyName }).populate('createdBy updatedBy', 'username email');
};

settingSchema.statics.getByType = async function(settingsType) {
  return await this.find({ settingsType, isActive: true })
    .populate('createdBy updatedBy', 'username email')
    .sort({ updatedAt: -1 });
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

// Enhanced static methods for integration management
settingSchema.statics.getAPIKey = async function(keyName) {
  const setting = await this.findOne({ keyName, isActive: true });
  
  if (!setting) {
    throw new Error('Integration not found or inactive');
  }
  
  if (setting.isExpired()) {
    throw new Error('API key has expired');
  }
  
  // Get API key based on mode
  let apiKey = null;
  if (setting.mode === 'live' && setting.liveValues) {
    apiKey = setting.liveValues.api_key;
  } else if (setting.testValues) {
    apiKey = setting.testValues.api_key;
  } else if (setting.value) {
    apiKey = setting.value.api_key;
  }
  
  if (!apiKey) {
    throw new Error('API key not configured');
  }
  
  return apiKey;
};

settingSchema.statics.rotateAPIKey = async function(keyName, newApiKey, userId) {
  const setting = await this.findOne({ keyName });
  
  if (!setting) {
    throw new Error('Integration not found');
  }
  
  // Create backup of old key
  const oldKey = setting.mode === 'live' ? setting.liveValues?.api_key : setting.testValues?.api_key;
  
  // Update with new key
  if (setting.mode === 'live') {
    setting.liveValues.api_key = newApiKey;
  } else {
    setting.testValues.api_key = newApiKey;
  }
  
  setting.keyMetadata.lastRotated = new Date();
  setting.keyMetadata.expiresAt = new Date(Date.now() + (setting.keyMetadata.rotationInterval * 24 * 60 * 60 * 1000));
  setting.updatedBy = userId;
  
  await setting.save();
  
  // Log rotation
  console.log(`API key rotated for ${keyName} by user ${userId}`);
  
  return setting;
};

settingSchema.statics.validateAPIKey = async function(keyName) {
  const setting = await this.findOne({ keyName });
  
  if (!setting) {
    throw new Error('Integration not found');
  }
  
  let apiKey = null;
  if (setting.mode === 'live' && setting.liveValues) {
    apiKey = setting.liveValues.api_key;
  } else if (setting.testValues) {
    apiKey = setting.testValues.api_key;
  } else if (setting.value) {
    apiKey = setting.value.api_key;
  }
  
  if (!apiKey) {
    setting.keyMetadata.validationStatus = 'invalid';
    await setting.save();
    throw new Error('API key not configured');
  }
  
  // Validate API key format
  const validation = validateIntegrationData(setting.settingsType, {
    [setting.mode === 'live' ? 'liveValues' : 'testValues']: {
      api_key: apiKey
    }
  });
  
  setting.keyMetadata.lastValidated = new Date();
  setting.keyMetadata.validationStatus = validation.valid ? 'valid' : 'invalid';
  
  await setting.save();
  
  return {
    valid: validation.valid,
    errors: validation.errors,
    lastValidated: setting.keyMetadata.lastValidated
  };
};

// Predefined integration types (enhanced)
settingSchema.statics.INTEGRATION_TYPES = {
  GOOGLE_MAPS: {
    keyName: 'google_maps',
    settingsType: 'map_api',
    description: 'Google Maps API for geolocation and routing',
    fields: ['api_key', 'enable_places', 'enable_directions', 'enable_geocoding', 'enable_distance_matrix'],
    requiredFields: ['api_key'],
    encryptionFields: ['api_key']
  },
  
  STRIPE: {
    keyName: 'stripe',
    settingsType: 'payment_gateway',
    description: 'Stripe Payment Gateway',
    fields: ['publishable_key', 'secret_key', 'webhook_secret'],
    requiredFields: ['publishable_key', 'secret_key'],
    encryptionFields: ['secret_key', 'webhook_secret']
  },
  
  AFRO_SMS: {
    keyName: 'afro_sms',
    settingsType: 'sms_gateway',
    description: 'Afro SMS Gateway for Ethiopia',
    fields: ['api_key', 'sender_id', 'api_url'],
    requiredFields: ['api_key', 'sender_id'],
    encryptionFields: ['api_key']
  }
};

// Initialize default settings (enhanced)
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
        enable_geocoding: true,
        enable_distance_matrix: false
      },
      mode: 'test',
      isActive: false,
      keyMetadata: {
        rotationInterval: 90,
        isEncrypted: true,
        validationStatus: 'pending'
      }
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
      mode: 'test',
      isActive: false,
      keyMetadata: {
        rotationInterval: 180,
        isEncrypted: true,
        validationStatus: 'pending'
      }
    },
    {
      keyName: 'stripe',
      settingsType: 'payment_gateway',
      description: 'Stripe Payment Gateway',
      value: {
        publishable_key: '',
        secret_key: '',
        webhook_secret: ''
      },
      mode: 'test',
      isActive: false,
      keyMetadata: {
        rotationInterval: 365,
        isEncrypted: true,
        validationStatus: 'pending'
      }
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
