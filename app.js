const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { setupSwagger } = require('./config/swagger');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// CORS - allow all origins for API access
app.use(cors({
  origin: true,
  credentials: true
}));

// Trust proxy for Render
app.set('trust proxy', 1);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files - simple and reliable
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } }
});
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Continuing without MongoDB connection...');
  }
};

// Pre-load models so Mongoose can populate references
require('./modules/user-management/models/UserLevel');
require('./modules/user-management/models/UserRole');
require('./modules/user-management/models/DriverDetail');

// ============================================
// API ROUTES
// ============================================

// Mobile/Frontend Auth API (phone-based, for parent & driver apps)
app.use('/api/auth', require('./modules/auth/routes/apiAuth'));

// Admin Auth API (protected admin operations)
app.use('/api/admin/auth', require('./modules/auth/routes/adminAuth'));

// User Profile API (update profile, phone change)
app.use('/api/users', require('./modules/auth/routes/profileRoutes'));

// User management API (admin)
app.use('/api/users', require('./modules/user-management/routes/userManagement'));

// Children API
app.use('/api/children', require('./modules/children/routes/children'));

// API Docs
app.use('/api/docs', require('./modules/api-docs/routes/apiDocs'));

// General API routes
app.use('/api', require('./routes/api'));

// Swagger UI
setupSwagger(app);

// ============================================
// WEB ROUTES (admin dashboard)
// ============================================
app.use('/', require('./routes/web'));
app.use('/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).render('error', {
      title: 'Page Not Found',
      message: `Route ${req.method} ${req.url} not found`
    });
  }
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'SERVER_ERROR', message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message }
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`UGO Server running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Admin:  http://localhost:${PORT}/admin/login`);
    console.log(`API:    http://localhost:${PORT}/api/auth`);
    console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  });
};

startServer().catch(console.error);
