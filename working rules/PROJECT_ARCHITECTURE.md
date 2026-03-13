# UGO Admin System - Project Architecture

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Module Architecture](#module-architecture)
5. [Data Flow](#data-flow)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Design Patterns](#api-design-patterns)
8. [Database Schema Design](#database-schema-design)
9. [Frontend Architecture](#frontend-architecture)
10. [Integration Patterns](#integration-patterns)

---

## System Overview

UGO Admin is a **modular Node.js/Express.js** application for managing a transportation and school management system. The architecture follows a **feature-based modular pattern** where each business domain is encapsulated in its own module.

### Core Principles
- **Modular Architecture**: Each feature is a self-contained module
- **Separation of Concerns**: Clear separation between routes, controllers, models, and views
- **Database-Driven Configuration**: Third-party integrations stored in database
- **RESTful API Design**: Standard HTTP methods and status codes
- **Server-Side Rendering**: EJS templates for admin interface
- **JWT Authentication**: Token-based auth with cookie support

---

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Express-validator
- **API Documentation**: Swagger/OpenAPI 3.0
- **Template Engine**: EJS

### Frontend
- **CSS Framework**: Bootstrap 5.3
- **Icons**: Font Awesome 6.4
- **JavaScript**: Vanilla ES6+ (no framework)
- **HTTP Client**: Fetch API

### Third-Party Services
- **Google Maps API**: Geocoding, Places, Directions
- **SMS Gateway**: Afro SMS
- **Push Notifications**: Firebase Cloud Messaging
- **Payment**: Stripe

---

## Directory Structure

```
Ugo_admin/
├── app.js                      # Main application entry point
├── server.js                   # Server configuration (legacy)
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables
│
├── config/                     # Configuration files
│   ├── database.js            # MongoDB connection
│   └── swagger.js             # Swagger/OpenAPI setup
│
├── core/                       # Core utilities
│   ├── errorHandler.js        # Global error handling
│   └── logger.js              # Logging utilities
│
├── modules/                    # Feature modules (main architecture)
│   ├── auth/                  # Authentication module
│   │   ├── controllers/       # Auth business logic
│   │   ├── middleware/        # Auth middleware
│   │   ├── models/            # Auth-related models
│   │   ├── routes/            # Auth API routes
│   │   ├── utils/             # Auth utilities (OTP, tokens)
│   │   └── views/             # Auth-specific views
│   │
│   ├── user-management/       # User management module
│   │   ├── controllers/       # User CRUD operations
│   │   ├── models/            # User model
│   │   ├── routes/            # User API routes
│   │   └── services/          # User business services
│   │
│   ├── schools/               # Schools module
│   │   ├── controllers/       # School CRUD + geolocation
│   │   ├── models/            # School model with GeoJSON
│   │   └── routes/            # School API routes
│   │
│   ├── integrations/          # Third-party integrations
│   │   ├── controllers/       # Integration management
│   │   ├── models/            # Settings model
│   │   ├── routes/            # Integration API routes
│   │   ├── services/          # Integration services (GoogleMaps, etc.)
│   │   └── migrations/        # Database migrations
│   │
│   ├── children/              # Children management
│   ├── api-docs/              # API documentation module
│   └── [other-modules]/       # Future modules follow same pattern
│
├── routes/                     # Global routes
│   ├── admin.js               # Admin panel routes (web)
│   └── api.js                 # General API routes
│
├── views/                      # EJS templates
│   ├── admin/                 # Admin panel views
│   │   ├── components/        # Reusable components (sidebar, header)
│   │   ├── views/             # Feature-specific views
│   │   │   ├── users/         # User management views
│   │   │   ├── schools/       # School management views
│   │   │   ├── integrations/  # Integration views
│   │   │   └── [feature]/     # Each feature has its own folder
│   │   └── layout.ejs         # Main layout template
│   │
│   ├── login.ejs              # Login page
│   └── register.ejs           # Registration page
│
└── public/                     # Static assets
    ├── css/                   # Stylesheets
    ├── js/                    # Client-side JavaScript
    └── images/                # Images and icons
```

---

## Module Architecture

### Standard Module Structure

Each module follows this consistent structure:

```
modules/[module-name]/
├── controllers/               # Business logic layer
│   └── [Feature]Controller.js
│
├── models/                    # Data models
│   └── [Model].js
│
├── routes/                    # API route definitions
│   └── [feature].js
│
├── services/                  # Business services (optional)
│   └── [Service].js
│
├── middleware/                # Module-specific middleware (optional)
│   └── [middleware].js
│
├── utils/                     # Utility functions (optional)
│   └── [utility].js
│
├── migrations/                # Database migrations (optional)
│   └── [migration].js
│
└── views/                     # Module-specific views (optional)
    └── [view].ejs
```

### Module Components Explained

#### 1. **Controllers** (`controllers/`)
- Handle HTTP requests and responses
- Validate input data
- Call services/models for business logic
- Return standardized JSON responses
- **Naming**: `[Feature]Controller.js` (e.g., `SchoolController.js`)

**Example Structure**:
```javascript
class SchoolController {
  static async getAll(req, res) { /* ... */ }
  static async getOne(req, res) { /* ... */ }
  static async create(req, res) { /* ... */ }
  static async update(req, res) { /* ... */ }
  static async delete(req, res) { /* ... */ }
}
module.exports = SchoolController;
```

#### 2. **Models** (`models/`)
- Define Mongoose schemas
- Include validation rules
- Define indexes
- Add instance and static methods
- **Naming**: PascalCase singular (e.g., `School.js`, `User.js`)

**Example Structure**:
```javascript
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // ... other fields
}, { timestamps: true });

// Indexes
schoolSchema.index({ location: '2dsphere' });

// Static methods
schoolSchema.statics.findNearby = function(lng, lat, maxDistance) { /* ... */ };

module.exports = mongoose.model('School', schoolSchema);
```

#### 3. **Routes** (`routes/`)
- Define API endpoints
- Apply middleware (authentication, validation)
- Include Swagger documentation
- **Naming**: Lowercase plural (e.g., `schools.js`, `users.js`)

**Example Structure**:
```javascript
const express = require('express');
const router = express.Router();
const SchoolController = require('../controllers/SchoolController');
const { authenticate } = require('../../auth/middleware/auth');

/**
 * @swagger
 * /api/schools:
 *   get:
 *     summary: Get all schools
 *     tags: [Schools]
 *     ...
 */
router.get('/', authenticate, SchoolController.getAll);

module.exports = router;
```

#### 4. **Services** (`services/`)
- Encapsulate complex business logic
- Handle third-party API calls
- Reusable across controllers
- **Naming**: `[Feature]Service.js` (e.g., `GoogleMapsService.js`)

**Example Structure**:
```javascript
class GoogleMapsService {
  static async getAPIKey() { /* ... */ }
  static async geocode(address) { /* ... */ }
  static async searchPlaces(lat, lng, radius) { /* ... */ }
}
module.exports = GoogleMapsService;
```

---

## Data Flow

### Request Flow (API)

```
Client Request
    ↓
Express App (app.js)
    ↓
Route Handler (routes/[module].js)
    ↓
Authentication Middleware (if protected)
    ↓
Validation Middleware (if needed)
    ↓
Controller (controllers/[Feature]Controller.js)
    ↓
Service (services/[Feature]Service.js) [optional]
    ↓
Model (models/[Model].js)
    ↓
MongoDB Database
    ↓
Response back through chain
    ↓
JSON Response to Client
```

### Request Flow (Admin Panel)

```
Browser Request
    ↓
Express App (app.js)
    ↓
Admin Route Handler (routes/admin.js)
    ↓
Web Authentication Middleware
    ↓
Render EJS Template (views/admin/views/[feature]/index.ejs)
    ↓
Template includes components (sidebar, header)
    ↓
Client-side JavaScript makes API calls
    ↓
[Follow API flow above]
    ↓
Update DOM with response
```

---

## Authentication & Authorization

### Authentication Methods

1. **Cookie-Based (Admin Panel)**
   - JWT stored in HTTP-only cookie
   - Cookie name: `adminAuth`
   - Used for server-side rendered pages

2. **Bearer Token (API)**
   - JWT in `Authorization: Bearer <token>` header
   - Used for API calls from mobile/external clients

### Middleware Chain

```javascript
// Public route (no auth)
router.post('/login', AuthController.login);

// Protected route (auth required)
router.get('/profile', authenticate, UserController.getProfile);

// Admin-only route
router.get('/users', authenticate, adminOnly, UserController.getAll);

// Web admin route
router.get('/admin/dashboard', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/dashboard');
});
```

### Middleware Locations
- **API Auth**: `modules/auth/middleware/auth.js`
- **Web Auth**: `modules/auth/middleware/webAuth.js`

---

## API Design Patterns

### Standard Response Format

**Success Response**:
```javascript
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": { /* ... */ },
    "pagination": { /* ... */ }
  }
}
```

**Error Response**:
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { /* ... */ }
  }
}
```

### HTTP Status Codes
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (auth required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### RESTful Endpoints Pattern

```
GET    /api/[resource]           - List all
GET    /api/[resource]/:id       - Get one
POST   /api/[resource]           - Create
PUT    /api/[resource]/:id       - Update (full)
PATCH  /api/[resource]/:id       - Update (partial)
DELETE /api/[resource]/:id       - Delete

# Special actions
POST   /api/[resource]/:id/[action]  - Custom action
GET    /api/[resource]/[query]       - Special query
```

---

## Database Schema Design

### Schema Patterns

#### 1. **Timestamps**
All schemas include automatic timestamps:
```javascript
{ timestamps: true }  // Adds createdAt, updatedAt
```

#### 2. **Soft Deletes**
```javascript
{
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}
```

#### 3. **Audit Fields**
```javascript
{
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}
```

#### 4. **Geospatial Data**
```javascript
{
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  latitude: Number,
  longitude: Number
}
// Index
schema.index({ location: '2dsphere' });
```

#### 5. **Flexible Configuration**
```javascript
{
  value: mongoose.Schema.Types.Mixed,  // For JSON data
  liveValues: mongoose.Schema.Types.Mixed,
  testValues: mongoose.Schema.Types.Mixed,
  mode: { type: String, enum: ['live', 'test'], default: 'test' }
}
```

---

## Frontend Architecture

### Admin Panel Structure

#### Component-Based Views
- **Layout**: `views/admin/layout.ejs` - Main wrapper
- **Components**: `views/admin/components/` - Reusable parts
  - `sidebar.ejs` - Navigation sidebar
  - `header.ejs` - Top header bar
  - `footer.ejs` - Footer
- **Views**: `views/admin/views/[feature]/` - Feature pages
  - `index.ejs` - List/main view
  - `partials/edit-modal.ejs` - Edit modal
  - `partials/view-modal.ejs` - View modal

#### Client-Side JavaScript Pattern

```javascript
// Global variables
const API = '/api/[resource]';
let allItems = [];

// Toast notifications
function showToast(msg, type = 'success') { /* ... */ }

// Load data
async function loadItems() {
  const res = await fetch(API, { credentials: 'include' });
  const data = await res.json();
  if (data.success) {
    allItems = data.data.items;
    renderItems();
  }
}

// Render to DOM
function renderItems() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = allItems.map(item => `
    <div class="item-card">...</div>
  `).join('');
}

// CRUD operations
async function createItem() { /* ... */ }
async function updateItem(id) { /* ... */ }
async function deleteItem(id) { /* ... */ }

// Initialize
loadItems();
```

---

## Integration Patterns

### Third-Party Service Integration

#### 1. **Database-Driven Configuration**
All third-party API keys and settings stored in `settings` collection:

```javascript
{
  keyName: 'google_maps',
  settingsType: 'map_api',
  value: {
    api_key: 'AIzaSy...',
    enable_places: true,
    enable_directions: true
  },
  mode: 'live',
  isActive: true
}
```

#### 2. **Service Layer Pattern**
Create a service class for each integration:

```javascript
// modules/integrations/services/GoogleMapsService.js
class GoogleMapsService {
  static async getAPIKey() {
    const integration = await Setting.findOne({ keyName: 'google_maps' });
    return integration.value.api_key;
  }
  
  static async geocode(address) { /* ... */ }
}
```

#### 3. **Usage in Controllers**
```javascript
const GoogleMapsService = require('../../integrations/services/GoogleMapsService');

class SchoolController {
  static async create(req, res) {
    // Use the service
    const result = await GoogleMapsService.geocode(address);
  }
}
```

### Integration Testing
Each integration must have a test method:
```javascript
static async testGoogleMapsAPI(config, testResult) {
  // Validate API key
  // Test actual API call
  // Return detailed results
}
```

---

## Key Architectural Decisions

### 1. **Why Modular Architecture?**
- **Scalability**: Easy to add new features
- **Maintainability**: Clear separation of concerns
- **Team Collaboration**: Different teams can work on different modules
- **Code Reusability**: Services can be shared across modules

### 2. **Why Database-Driven Configuration?**
- **Dynamic Updates**: Change API keys without code deployment
- **Multi-Environment**: Separate live/test configurations
- **Security**: No hardcoded secrets in code
- **Audit Trail**: Track configuration changes

### 3. **Why EJS for Admin Panel?**
- **Server-Side Rendering**: Better SEO and initial load
- **Simple Syntax**: Easy to learn and maintain
- **Component Reusability**: Partials and includes
- **No Build Step**: Direct template rendering

### 4. **Why Mongoose ODM?**
- **Schema Validation**: Built-in data validation
- **Middleware Hooks**: Pre/post save operations
- **Population**: Easy relationship handling
- **Query Building**: Chainable query methods

---

## Performance Considerations

### Database Optimization
- **Indexes**: Add indexes on frequently queried fields
- **Lean Queries**: Use `.lean()` for read-only operations
- **Select Fields**: Only fetch needed fields
- **Pagination**: Implement pagination for large datasets

### API Optimization
- **Caching**: Cache frequently accessed data
- **Compression**: Enable gzip compression
- **Rate Limiting**: Prevent API abuse
- **Connection Pooling**: Reuse database connections

### Frontend Optimization
- **Lazy Loading**: Load data on demand
- **Debouncing**: Delay search queries
- **Minification**: Minify CSS/JS in production
- **CDN**: Use CDN for static assets

---

## Security Best Practices

1. **Authentication**: JWT with HTTP-only cookies
2. **Authorization**: Role-based access control
3. **Input Validation**: Validate all user inputs
4. **SQL Injection**: Use parameterized queries (Mongoose handles this)
5. **XSS Prevention**: Escape user-generated content
6. **CORS**: Configure CORS properly
7. **Rate Limiting**: Prevent brute force attacks
8. **Environment Variables**: Store secrets in .env
9. **HTTPS**: Use HTTPS in production
10. **Security Headers**: Use helmet.js

---

This architecture document should be updated as the system evolves and new patterns emerge.
