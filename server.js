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

// Security middleware with custom CSP - UPDATED FOR PRODUCTION
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      styleSrcElem: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      scriptSrcElem: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://picsum.photos", "https://fastly.picsum.photos", "https://ui-avatars.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : []
    }
  },
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

// Static files - FIXED FOR RENDER DEPLOYMENT
if (process.env.NODE_ENV === 'production') {
  // Production static file serving with proper MIME types
  app.use('/js', express.static(path.join(__dirname, 'public/js'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
  
  app.use('/css', express.static(path.join(__dirname, 'public/css'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
  
  app.use('/images', express.static(path.join(__dirname, 'public/images')));
  app.use('/public', express.static(path.join(__dirname, 'public')));
} else {
  // Development static serving
  app.use('/js', express.static(path.join(__dirname, 'public/js')));
  app.use('/css', express.static(path.join(__dirname, 'public/css')));
  app.use('/images', express.static(path.join(__dirname, 'public/images')));
  app.use('/public', express.static(path.join(__dirname, 'public')));
}

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Continuing without MongoDB connection...');
    // Don't exit process, continue without database for testing
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

// Seed admin user (for development)
app.post('/seed-admin', async (req, res) => {
  try {
    const createAdminUser = require('./seed-admin');
    const adminUser = await createAdminUser();
    res.json({
      success: true,
      message: 'Admin user seeded successfully',
      data: {
        id: adminUser._id,
        email: adminUser.email,
        name: `${adminUser.firstName} ${adminUser.lastName}`
      }
    });
  } catch (error) {
    console.error('Seed admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed admin user'
    });
  }
});

// Reset admin user (for development)
app.post('/reset-admin', async (req, res) => {
  try {
    const resetAdminUser = require('./reset-admin');
    const adminUser = await resetAdminUser();
    res.json({
      success: true,
      message: 'Admin user reset successfully',
      data: {
        id: adminUser._id,
        email: adminUser.email,
        name: `${adminUser.firstName} ${adminUser.lastName}`,
        isActive: adminUser.isActive
      }
    });
  } catch (error) {
    console.error('Reset admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset admin user'
    });
  }
});

// Fix admin user (for development)
app.post('/fix-admin', async (req, res) => {
  try {
    const fixAdminUser = require('./fix-admin');
    const adminUser = await fixAdminUser();
    res.json({
      success: true,
      message: 'Admin user fixed successfully',
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
    console.error('Fix admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix admin user'
    });
  }
});

// Create simple admin user (for development)
app.post('/create-simple-admin', async (req, res) => {
  try {
    const createSimpleAdmin = require('./create-simple-admin');
    const adminUser = await createSimpleAdmin();
    res.json({
      success: true,
      message: 'Simple admin user created successfully',
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
    console.error('Create simple admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create simple admin user'
    });
  }
});

// Test admin authentication (for development)
app.post('/test-admin', async (req, res) => {
  try {
    const testAdminAuth = require('./test-admin');
    await testAdminAuth();
    res.json({
      success: true,
      message: 'Admin authentication test completed - check server logs'
    });
  } catch (error) {
    console.error('Test admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test admin authentication'
    });
  }
});

// Recreate admin user (for development)
app.post('/recreate-admin', async (req, res) => {
  try {
    const recreateAdminUser = require('./recreate-admin');
    const adminUser = await recreateAdminUser();
    res.json({
      success: true,
      message: 'Admin user recreated successfully',
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
    console.error('Recreate admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to recreate admin user'
    });
  }
});

// Quick fix admin user (for development)
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

// Create sample users (for development)
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

// User Management API Routes
app.use('/api/users', require('./modules/user-management/routes/userManagement'));

// Start server
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`UGO Server running on port ${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/health`);
    console.log(`Landing Page: http://localhost:${PORT}/`);
  });
};

startServer();

module.exports = app;
