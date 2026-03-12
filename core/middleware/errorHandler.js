const { formatResponse } = require('../utils/helpers');

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(
      formatResponse(false, 'Validation Error', { errors })
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(
      formatResponse(false, `${field} already exists`)
    );
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      formatResponse(false, 'Invalid token')
    );
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json(
    formatResponse(false, message, process.env.NODE_ENV === 'development' ? err.stack : null)
  );
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json(
    formatResponse(false, 'Route not found')
  );
};

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger
};
