const mongoose = require('mongoose');

/**
 * Database connection helper
 */
class DatabaseHelper {
  /**
   * Check database connection status
   * @returns {Boolean} Connection status
   */
  static isConnected() {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status string
   * @returns {String} Connection status
   */
  static getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState];
  }

  /**
   * Graceful database shutdown
   */
  static async closeConnection() {
    try {
      await mongoose.connection.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

module.exports = DatabaseHelper;
