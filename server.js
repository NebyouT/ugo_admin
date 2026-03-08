const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create admin user if it doesn't exist
    await createAdminUser();
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Continuing without MongoDB connection...');
  }
};

// Create admin user function
const createAdminUser = async () => {
  try {
    const User = require('./models/User');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL, role: 'admin' });
    
    if (!existingAdmin) {
      // Create admin user
      const adminData = {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        firstName: process.env.ADMIN_FIRST_NAME,
        lastName: process.env.ADMIN_LAST_NAME,
        role: 'admin'
      };
      
      const admin = await User.create(adminData);
      console.log('Admin user created successfully:', admin.email);
    } else {
      console.log('Admin user already exists:', existingAdmin.email);
    }
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

// Connect to MongoDB (optional for now)
connectDB();

// Routes
app.get('/', (req, res) => {
  res.render('landing', { title: 'UGO - Student Transportation System' });
});

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// Parent routes
const parentRoutes = require('./routes/parents');
app.use('/admin/parents', parentRoutes);

// School routes
const schoolRoutes = require('./routes/schools');
app.use('/admin/schools', schoolRoutes);

// Children routes
const childRoutes = require('./routes/children');
app.use('/admin/children', childRoutes);

// Integration routes
const integrationRoutes = require('./routes/integrations');
app.use('/admin/integrations', integrationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`UGO Server running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Landing Page: http://localhost:${PORT}/`);
  console.log(`Admin Login: http://localhost:${PORT}/admin`);
});
