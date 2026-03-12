const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security middleware with relaxed CSP for production debugging
app.use(helmet({
  contentSecurityPolicy: false, // Temporarily disable CSP for debugging
  crossOriginEmbedderPolicy: false
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// CRITICAL: Static files MUST be served before everything else
console.log('Setting up static file serving...');

// Serve static files with explicit paths
app.use('/js', express.static(path.join(__dirname, 'public/js'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    console.log('Serving JS file:', filePath);
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

app.use('/css', express.static(path.join(__dirname, 'public/css'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Add a debug route to check static files
app.get('/debug/static', (req, res) => {
  const loginJsPath = path.join(__dirname, 'public/js/login.js');
  const exists = require('fs').existsSync(loginJsPath);
  res.json({
    loginJsPath,
    exists,
    publicDir: path.join(__dirname, 'public'),
    files: require('fs').readdirSync(path.join(__dirname, 'public/js'))
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

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API Routes (MUST come after static files)
app.use('/api', require('./routes/api'));
app.use('/api/auth', require('./modules/auth/routes/apiAuth'));
app.use('/api/admin/auth', require('./modules/auth/routes/adminAuth'));

// Page Routes (MUST come last to avoid conflicts with static files)
app.use('/', require('./routes/web'));
app.use('/admin', require('./routes/admin'));

// Development routes (remove in production)
if (process.env.NODE_ENV !== 'production') {
  app.post('/quick-fix-admin', async (req, res) => {
    try {
      const quickFixAdmin = require('./quick-fix-admin');
      const adminUser = await quickFixAdmin();
      res.json({
        success: true,
        message: 'Admin user created with quick fix',
        data: {
          id: adminUser._id,
          email: adminUser.email,
          name: `${adminUser.firstName} ${adminUser.lastName}`,
          userType: adminUser.userType,
          role: adminUser.role,
          isActive: adminUser.isActive
        }
      });
    } catch (error) {
      console.error('Quick fix admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create admin user with quick fix'
      });
    }
  });

  app.post('/create-sample-users', async (req, res) => {
    try {
      const createSampleUsers = require('./create-sample-users');
      const users = await createSampleUsers();
      res.json({
        success: true,
        message: 'Sample users created successfully',
        data: {
          count: users.length,
          users: users.map(u => ({
            id: u._id,
            email: u.email,
            name: `${u.firstName} ${u.lastName}`,
            userType: u.userType,
            isActive: u.isActive
          }))
        }
      });
    } catch (error) {
      console.error('Create sample users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create sample users'
      });
    }
  });
}

// User Management API Routes
app.use('/api/users', require('./modules/user-management/routes/userManagement'));

// Start server
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`UGO Server running on port ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    console.log(`Landing Page: http://localhost:${PORT}/`);
    console.log(`Static files debug: http://localhost:${PORT}/debug/static`);
  });
};

startServer();
