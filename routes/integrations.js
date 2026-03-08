const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const Settings = require('../models/Settings');

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// ===== VIEW ROUTES =====

// @desc    Third party integrations main page
// @route   GET /admin/integrations
router.get('/', (req, res) => {
  res.render('admin/integrations/index', { 
    title: 'Integrations - UGO Admin', 
    user: req.user 
  });
});

// @desc    Google Maps API configuration page
// @route   GET /admin/integrations/google-maps
router.get('/google-maps', (req, res) => {
  res.render('admin/integrations/google-maps', { 
    title: 'Google Maps API - UGO Admin', 
    user: req.user 
  });
});

// ===== API ROUTES =====

// @desc    Save Google Maps API configuration
// @route   POST /admin/integrations/api/google-maps
router.post('/api/google-maps', async (req, res) => {
  try {
    const { apiKey, enableGeocoding, enablePlaces, enableMaps } = req.body;
    
    // Validate API key format (Google Maps API keys are typically 39 characters long)
    if (!apiKey || apiKey.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google Maps API key format. API keys are typically 39 characters long and start with "AIza"'
      });
    }
    
    // Additional validation for Google Maps API key format
    if (!apiKey.startsWith('AIza')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google Maps API key. API keys should start with "AIza"'
      });
    }
    
    // Test the API key before saving
    try {
      await Settings.testGoogleMapsApiKey(apiKey);
    } catch (testError) {
      return res.status(400).json({
        success: false,
        message: `API key validation failed: ${testError.message}. Please check your API key and ensure Google Maps JavaScript API is enabled.`
      });
    }
    
    // Save configuration to database
    const config = {
      apiKey: apiKey,
      enableGeocoding: enableGeocoding || false,
      enablePlaces: enablePlaces || false,
      enableMaps: enableMaps || false
    };
    
    await Settings.saveGoogleMapsConfig(config, req.user._id);
    
    res.json({
      success: true,
      message: 'Google Maps API configuration saved successfully',
      data: {
        apiKey: apiKey.substring(0, 10) + '...', // Only return partial key for security
        features: {
          geocoding: enableGeocoding || false,
          places: enablePlaces || false,
          maps: enableMaps || false
        }
      }
    });
  } catch (error) {
    console.error('Save Google Maps config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving Google Maps configuration'
    });
  }
});

// @desc    Get Google Maps API configuration
// @route   GET /admin/integrations/api/google-maps
router.get('/api/google-maps', async (req, res) => {
  try {
    const config = await Settings.getGoogleMapsConfig();
    
    res.json({
      success: true,
      data: {
        hasApiKey: !!config.apiKey,
        apiKeyPreview: config.apiKey ? config.apiKey.substring(0, 10) + '...' : null,
        features: {
          geocoding: config.enableGeocoding,
          places: config.enablePlaces,
          maps: config.enableMaps
        },
        lastUpdated: config.updatedAt
      }
    });
  } catch (error) {
    console.error('Get Google Maps config error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving Google Maps configuration'
    });
  }
});

// @desc    Test Google Maps API connection
// @route   POST /admin/integrations/api/google-maps/test
router.post('/api/google-maps/test', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required for testing'
      });
    }
    
    // Test the API key using the Settings model
    const result = await Settings.testGoogleMapsApiKey(apiKey);
    
    res.json({
      success: true,
      message: 'Google Maps API key is valid and working',
      data: result
    });
  } catch (error) {
    console.error('Test Google Maps API error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Google Maps API test failed'
    });
  }
});

// @desc    Geocode address
// @route   POST /admin/integrations/api/google-maps/geocode
router.post('/api/google-maps/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required for geocoding'
      });
    }
    
    const result = await Settings.geocodeAddress(address);
    
    res.json({
      success: true,
      message: 'Address geocoded successfully',
      data: result
    });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Geocoding failed'
    });
  }
});

// @desc    Reverse geocode coordinates
// @route   POST /admin/integrations/api/google-maps/reverse-geocode
router.post('/api/google-maps/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for reverse geocoding'
      });
    }
    
    const result = await Settings.reverseGeocode(lat, lng);
    
    res.json({
      success: true,
      message: 'Coordinates reverse geocoded successfully',
      data: result
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Reverse geocoding failed'
    });
  }
});

module.exports = router;
