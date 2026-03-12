const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// CRITICAL: Serve static files FIRST with explicit handling
console.log('🔧 Setting up static file serving...');

// Explicit static file serving for each directory
app.use('/js', (req, res, next) => {
  console.log(`📁 JS Request: ${req.url}`);
  const filePath = path.join(__dirname, 'public', 'js', req.url);
  
  if (fs.existsSync(filePath)) {
    console.log(`✅ Serving JS file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(content);
  } else {
    console.log(`❌ JS file not found: ${filePath}`);
    res.status(404).send('// File not found');
  }
});

app.use('/css', (req, res, next) => {
  console.log(`📁 CSS Request: ${req.url}`);
  const filePath = path.join(__dirname, 'public', 'css', req.url);
  
  if (fs.existsSync(filePath)) {
    console.log(`✅ Serving CSS file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(content);
  } else {
    console.log(`❌ CSS file not found: ${filePath}`);
    res.status(404).send('/* File not found */');
  }
});

app.use('/images', (req, res, next) => {
  console.log(`📁 Image Request: ${req.url}`);
  const filePath = path.join(__dirname, 'public', 'images', req.url);
  
  if (fs.existsSync(filePath)) {
    console.log(`✅ Serving image: ${filePath}`);
    res.sendFile(filePath);
  } else {
    console.log(`❌ Image not found: ${filePath}`);
    res.status(404).send('Image not found');
  }
});

// Fallback static serving
app.use('/public', express.static(path.join(__dirname, 'public')));

// Debug endpoint
app.get('/debug/files', (req, res) => {
  const publicDir = path.join(__dirname, 'public');
  const jsDir = path.join(__dirname, 'public', 'js');
  const loginJsPath = path.join(__dirname, 'public', 'js', 'login.js');
  
  const debug = {
    cwd: process.cwd(),
    publicDir: publicDir,
    publicExists: fs.existsSync(publicDir),
    jsDir: jsDir,
    jsExists: fs.existsSync(jsDir),
    loginJsPath: loginJsPath,
    loginJsExists: fs.existsSync(loginJsPath),
    publicFiles: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [],
    jsFiles: fs.existsSync(jsDir) ? fs.readdirSync(jsDir) : [],
    loginJsSize: fs.existsSync(loginJsPath) ? fs.statSync(loginJsPath).size : 0
  };
  
  res.json(debug);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.1'
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ugo');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️ Continuing without MongoDB connection...');
  }
};

// API Routes
app.use('/api', require('./routes/api'));
app.use('/api/auth', require('./modules/auth/routes/apiAuth'));
app.use('/api/admin/auth', require('./modules/auth/routes/adminAuth'));

// Page Routes (LAST)
app.use('/', require('./routes/web'));
app.use('/admin', require('./routes/admin'));

// 404 handler
app.use((req, res, next) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 UGO Server running on port ${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🐛 Debug Files: http://localhost:${PORT}/debug/files`);
    console.log(`🏠 Landing Page: http://localhost:${PORT}/`);
    console.log(`🔐 Admin Login: http://localhost:${PORT}/admin/login`);
    
    // Test static file serving
    const loginJsPath = path.join(__dirname, 'public', 'js', 'login.js');
    console.log(`📁 Login.js exists: ${fs.existsSync(loginJsPath)}`);
    if (fs.existsSync(loginJsPath)) {
      console.log(`📏 Login.js size: ${fs.statSync(loginJsPath).size} bytes`);
    }
  });
};

startServer().catch(console.error);
