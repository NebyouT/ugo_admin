const Setting = require('../models/Setting');

class GoogleMapsService {
  static async getAPIKey() {
    try {
      const integration = await Setting.findOne({ keyName: 'google_maps' });
      
      if (!integration || !integration.isActive) {
        throw new Error('Google Maps integration not found or inactive');
      }
      
      // Get API key based on mode
      let apiKey = null;
      if (integration.mode === 'live' && integration.liveValues) {
        apiKey = integration.liveValues.api_key;
      } else if (integration.testValues) {
        apiKey = integration.testValues.api_key;
      } else if (integration.value) {
        apiKey = integration.value.api_key;
      }
      
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }
      
      return apiKey;
    } catch (error) {
      console.error('Failed to get Google Maps API key:', error);
      throw error;
    }
  }
  
  static async getConfig() {
    try {
      const integration = await Setting.findOne({ keyName: 'google_maps' });
      
      if (!integration || !integration.isActive) {
        throw new Error('Google Maps integration not found or inactive');
      }
      
      // Get configuration based on mode
      let config = null;
      if (integration.mode === 'live' && integration.liveValues) {
        config = integration.liveValues;
      } else if (integration.testValues) {
        config = integration.testValues;
      } else if (integration.value) {
        config = integration.value;
      }
      
      if (!config) {
        throw new Error('Google Maps configuration not found');
      }
      
      return {
        apiKey: config.api_key,
        enablePlaces: config.enable_places || false,
        enableDirections: config.enable_directions || false,
        enableGeocoding: config.enable_geocoding || false,
        enableDistanceMatrix: config.enable_distance_matrix || false
      };
    } catch (error) {
      console.error('Failed to get Google Maps config:', error);
      throw error;
    }
  }
  
  // Geocoding: Convert address to coordinates
  static async geocode(address) {
    try {
      const config = await this.getConfig();
      
      if (!config.enableGeocoding) {
        throw new Error('Geocoding is not enabled');
      }
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return {
          success: true,
          results: data.results,
          location: data.results[0]?.geometry?.location,
          formattedAddress: data.results[0]?.formatted_address
        };
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API access denied: ' + (data.error_message || 'Invalid API key'));
      } else if (data.status === 'ZERO_RESULTS') {
        return {
          success: false,
          status: 'ZERO_RESULTS',
          message: 'No results found for this address'
        };
      } else {
        throw new Error('Geocoding failed: ' + data.status);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
  
  // Reverse Geocoding: Convert coordinates to address
  static async reverseGeocode(latitude, longitude) {
    try {
      const config = await this.getConfig();
      
      if (!config.enableGeocoding) {
        throw new Error('Geocoding is not enabled');
      }
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${config.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return {
          success: true,
          results: data.results,
          address: data.results[0]?.formatted_address,
          components: data.results[0]?.address_components
        };
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API access denied: ' + (data.error_message || 'Invalid API key'));
      } else {
        throw new Error('Reverse geocoding failed: ' + data.status);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }
  
  // Places API: Search for places near a location
  static async searchPlaces(latitude, longitude, radius = 5000, keyword = '', type = '') {
    try {
      const config = await this.getConfig();
      
      if (!config.enablePlaces) {
        throw new Error('Places API is not enabled');
      }
      
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${config.apiKey}`;
      
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }
      
      if (type) {
        url += `&type=${type}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return {
          success: true,
          results: data.results,
          next_page_token: data.next_page_token
        };
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API access denied: ' + (data.error_message || 'Invalid API key'));
      } else if (data.status === 'ZERO_RESULTS') {
        return {
          success: true,
          results: [],
          message: 'No places found'
        };
      } else {
        throw new Error('Places search failed: ' + data.status);
      }
    } catch (error) {
      console.error('Places search error:', error);
      throw error;
    }
  }
  
  // Directions API: Get directions between two points
  static async getDirections(origin, destination, mode = 'driving') {
    try {
      const config = await this.getConfig();
      
      if (!config.enableDirections) {
        throw new Error('Directions API is not enabled');
      }
      
      const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
      
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=${mode}&key=${config.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return {
          success: true,
          routes: data.routes,
          legs: data.routes[0]?.legs,
          distance: data.routes[0]?.legs[0]?.distance,
          duration: data.routes[0]?.legs[0]?.duration
        };
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API access denied: ' + (data.error_message || 'Invalid API key'));
      } else {
        throw new Error('Directions failed: ' + data.status);
      }
    } catch (error) {
      console.error('Directions error:', error);
      throw error;
    }
  }
  
  // Distance Matrix API: Calculate distances between multiple points
  static async getDistanceMatrix(origins, destinations, mode = 'driving') {
    try {
      const config = await this.getConfig();
      
      if (!config.enableDistanceMatrix) {
        throw new Error('Distance Matrix API is not enabled');
      }
      
      const originsStr = Array.isArray(origins) ? origins.map(o => typeof o === 'string' ? o : `${o.lat},${o.lng}`).join('|') : origins;
      const destinationsStr = Array.isArray(destinations) ? destinations.map(d => typeof d === 'string' ? d : `${d.lat},${d.lng}`).join('|') : destinations;
      
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${mode}&key=${config.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return {
          success: true,
          rows: data.rows,
          elements: data.rows[0]?.elements
        };
      } else if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API access denied: ' + (data.error_message || 'Invalid API key'));
      } else {
        throw new Error('Distance Matrix failed: ' + data.status);
      }
    } catch (error) {
      console.error('Distance Matrix error:', error);
      throw error;
    }
  }
  
  // Validate API key is working
  static async validateAPIKey() {
    try {
      const result = await this.geocode('Addis Ababa, Ethiopia');
      return {
        valid: result.success,
        message: result.success ? 'API key is valid' : result.message || 'API key validation failed'
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message
      };
    }
  }
}

module.exports = GoogleMapsService;
