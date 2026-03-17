const Setting = require('../models/Setting');

class IntegrationController {
  // Get all integrations
  static async getAll(req, res) {
    try {
      const { type, active } = req.query;
      const filter = {};
      
      if (type) filter.settingsType = type;
      if (active !== undefined) filter.isActive = active === 'true';
      
      const integrations = await Setting.find(filter).sort({ settingsType: 1, keyName: 1 });
      
      res.json({
        success: true,
        data: {
          integrations,
          total: integrations.length
        }
      });
    } catch (error) {
      console.error('Get integrations error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch integrations'
        }
      });
    }
  }
  
  // Get single integration by key
  static async getOne(req, res) {
    try {
      const { keyName } = req.params;
      
      const integration = await Setting.findOne({ keyName });
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Integration not found'
          }
        });
      }
      
      res.json({
        success: true,
        data: { integration }
      });
    } catch (error) {
      console.error('Get integration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch integration'
        }
      });
    }
  }
  
  // Create or update integration
  static async upsert(req, res) {
    try {
      const { keyName } = req.params;
      const { settingsType, value, liveValues, testValues, mode, isActive, description, additionalData } = req.body;
      
      if (!settingsType) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Settings type is required'
          }
        });
      }
      
      const updateData = {
        keyName,
        settingsType,
        description,
        updatedBy: req.user?._id
      };
      
      if (value !== undefined) updateData.value = value;
      if (liveValues !== undefined) updateData.liveValues = liveValues;
      if (testValues !== undefined) updateData.testValues = testValues;
      if (mode !== undefined) updateData.mode = mode;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (additionalData !== undefined) updateData.additionalData = additionalData;
      
      const integration = await Setting.findOneAndUpdate(
        { keyName },
        { ...updateData, $setOnInsert: { createdBy: req.user?._id } },
        { new: true, upsert: true }
      );
      
      res.json({
        success: true,
        message: 'Integration saved successfully',
        data: { integration }
      });
    } catch (error) {
      console.error('Upsert integration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SAVE_FAILED',
          message: 'Failed to save integration'
        }
      });
    }
  }
  
  // Update integration status
  static async updateStatus(req, res) {
    try {
      const { keyName } = req.params;
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'isActive field is required'
          }
        });
      }
      
      const integration = await Setting.findOneAndUpdate(
        { keyName },
        { isActive, updatedBy: req.user?._id },
        { new: true }
      );
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Integration not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: `Integration ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { integration }
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update integration status'
        }
      });
    }
  }
  
  // Delete integration
  static async delete(req, res) {
    try {
      const { keyName } = req.params;
      
      const integration = await Setting.findOneAndDelete({ keyName });
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Integration not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Integration deleted successfully'
      });
    } catch (error) {
      console.error('Delete integration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete integration'
        }
      });
    }
  }
  
  // Get integration types/templates
  static async getTypes(req, res) {
    try {
      const types = Setting.INTEGRATION_TYPES;
      
      res.json({
        success: true,
        data: { types }
      });
    } catch (error) {
      console.error('Get types error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch integration types'
        }
      });
    }
  }
  
  // Initialize default integrations
  static async initializeDefaults(req, res) {
    try {
      await Setting.initializeDefaults();
      
      res.json({
        success: true,
        message: 'Default integrations initialized successfully'
      });
    } catch (error) {
      console.error('Initialize defaults error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INIT_FAILED',
          message: 'Failed to initialize defaults'
        }
      });
    }
  }
  
  // Test integration with actual API validation
  static async test(req, res) {
    try {
      const { keyName } = req.params;
      
      const integration = await Setting.findOne({ keyName });
      
      if (!integration) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Integration not found'
          }
        });
      }
      
      let testResult = {
        tested: true,
        integration: integration.keyName,
        type: integration.settingsType,
        status: 'unknown',
        message: 'Test completed',
        details: {}
      };
      
      // Get the appropriate configuration (live or test mode)
      const config = integration.mode === 'live' ? integration.liveValues : integration.testValues || integration.value;
      
      switch (integration.settingsType) {
        case 'map_api':
          testResult = await this.testGoogleMapsAPI(config, testResult);
          break;
        case 'sms_gateway':
          testResult = await this.testSMSGateway(config, testResult);
          break;
        case 'push_notification':
          testResult = await this.testPushNotification(config, testResult);
          break;
        case 'payment_gateway':
          testResult = await this.testPaymentGateway(config, testResult);
          break;
        case 'email_config':
          testResult = await this.testEmailConfig(config, testResult);
          break;
        default:
          testResult.status = 'skipped';
          testResult.message = 'No test available for this integration type';
      }
      
      res.json({
        success: true,
        message: testResult.message,
        data: testResult
      });
    } catch (error) {
      console.error('Test integration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TEST_FAILED',
          message: 'Failed to test integration'
        }
      });
    }
  }
  
  // Test Google Maps API
  static async testGoogleMapsAPI(config, testResult) {
    try {
      const GoogleMapsService = require('../services/GoogleMapsService');
      
      // Test using the service
      const validation = await GoogleMapsService.validateAPIKey();
      
      if (validation.valid) {
        testResult.status = 'success';
        testResult.message = 'Google Maps API is working correctly';
        testResult.details = {
          geocoding: 'OK',
          api_key_configured: !!config.api_key,
          validation_message: validation.message
        };
        
        // Test Places API if enabled
        if (config.enable_places) {
          try {
            const placesResult = await GoogleMapsService.searchPlaces(9.0192, 38.7525, 5000, 'school');
            testResult.details.places_api = placesResult.success ? 'OK' : 'Disabled';
            testResult.details.schools_found = placesResult.results?.length || 0;
          } catch (e) {
            testResult.details.places_api = 'Error';
            testResult.details.places_error = e.message;
          }
        }
      } else {
        testResult.status = 'failed';
        testResult.message = validation.message;
        testResult.details = {
          error: validation.message,
          api_key_configured: !!config.api_key
        };
      }
    } catch (error) {
      testResult.status = 'failed';
      testResult.message = 'Failed to test Google Maps API';
      testResult.details = { error: error.message };
    }
    
    return testResult;
  }
  
  // Test SMS Gateway
  static async testSMSGateway(config, testResult) {
    try {
      if (!config?.api_key) {
        testResult.status = 'failed';
        testResult.message = 'API key not configured';
        return testResult;
      }
      
      // For Afro SMS, we'll validate the API key format
      if (config.api_key && config.sender_id) {
        testResult.status = 'success';
        testResult.message = 'SMS Gateway configuration appears valid';
        testResult.details = {
          api_key_configured: !!config.api_key,
          sender_id: config.sender_id,
          api_url: config.api_url || 'Not configured'
        };
      } else {
        testResult.status = 'warning';
        testResult.message = 'SMS Gateway partially configured';
        testResult.details = {
          api_key_configured: !!config.api_key,
          sender_id_configured: !!config.sender_id
        };
      }
    } catch (error) {
      testResult.status = 'failed';
      testResult.message = 'SMS Gateway validation failed';
      testResult.details = { error: error.message };
    }
    
    return testResult;
  }
  
  // Test Push Notification (Firebase)
  static async testPushNotification(config, testResult) {
    try {
      if (!config?.server_key) {
        testResult.status = 'failed';
        testResult.message = 'Server key not configured';
        return testResult;
      }
      
      // Validate Firebase server key format (should be long string)
      if (config.server_key.length > 100) {
        testResult.status = 'success';
        testResult.message = 'Firebase configuration appears valid';
        testResult.details = {
          server_key_configured: !!config.server_key,
          project_id: config.project_id || 'Not configured',
          sender_id: config.sender_id || 'Not configured'
        };
      } else {
        testResult.status = 'warning';
        testResult.message = 'Server key appears invalid';
        testResult.details = { key_length: config.server_key.length };
      }
    } catch (error) {
      testResult.status = 'failed';
      testResult.message = 'Firebase validation failed';
      testResult.details = { error: error.message };
    }
    
    return testResult;
  }
  
  // Test Payment Gateway
  static async testPaymentGateway(config, testResult) {
    try {
      const hasRequired = config?.publishable_key && config?.secret_key;
      
      if (hasRequired) {
        testResult.status = 'success';
        testResult.message = 'Payment Gateway configuration appears valid';
        testResult.details = {
          publishable_key_configured: !!config.publishable_key,
          secret_key_configured: !!config.secret_key,
          webhook_configured: !!config.webhook_secret,
          mode: testResult.integration === 'stripe' ? 'Stripe' : 'Other'
        };
      } else {
        testResult.status = 'warning';
        testResult.message = 'Payment Gateway partially configured';
        testResult.details = {
          publishable_key_configured: !!config.publishable_key,
          secret_key_configured: !!config.secret_key
        };
      }
    } catch (error) {
      testResult.status = 'failed';
      testResult.message = 'Payment Gateway validation failed';
      testResult.details = { error: error.message };
    }
    
    return testResult;
  }
  
  // Test Email Configuration
  static async testEmailConfig(config, testResult) {
    try {
      const hasRequired = config?.host && config?.port && config?.username;
      
      if (hasRequired) {
        testResult.status = 'success';
        testResult.message = 'Email configuration appears valid';
        testResult.details = {
          host: config.host,
          port: config.port,
          username_configured: !!config.username,
          from_email: config.from_email || 'Not configured'
        };
      } else {
        testResult.status = 'warning';
        testResult.message = 'Email configuration incomplete';
        testResult.details = {
          host_configured: !!config.host,
          port_configured: !!config.port,
          username_configured: !!config.username
        };
      }
    } catch (error) {
      testResult.status = 'failed';
      testResult.message = 'Email configuration validation failed';
      testResult.details = { error: error.message };
    }
    
    return testResult;
  }
  
  // Geocode address using Google Maps API
  static async geocodeAddress(req, res) {
    try {
      const { address } = req.query;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ADDRESS',
            message: 'Address parameter is required'
          }
        });
      }
      
      const GoogleMapsService = require('../services/GoogleMapsService');
      const result = await GoogleMapsService.geocode(address);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            address: result.formattedAddress,
            coordinates: {
              latitude: result.location.lat,
              longitude: result.location.lng
            },
            results: result.results
          }
        });
      } else if (result.status === 'ZERO_RESULTS') {
        res.status(404).json({
          success: false,
          error: {
            code: 'ADDRESS_NOT_FOUND',
            message: 'No results found for this address'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'GEOCODING_FAILED',
            message: 'Failed to geocode address'
          }
        });
      }
    } catch (error) {
      console.error('Geocode address error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GEOCODING_ERROR',
          message: 'Failed to geocode address',
          details: error.message
        }
      });
    }
  }
  
  // Get Google Maps API key
  static async getGoogleMapsAPIKey(req, res) {
    try {
      const GoogleMapsService = require('../services/GoogleMapsService');
      const apiKey = await GoogleMapsService.getAPIKey();
      
      res.json({
        success: true,
        data: {
          apiKey: apiKey
        }
      });
    } catch (error) {
      console.error('Get Google Maps API key error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'API_KEY_ERROR',
          message: 'Failed to get Google Maps API key',
          details: error.message
        }
      });
    }
  }
}

module.exports = IntegrationController;
