# UGO Admin System - Development Rules & Standards

## 📋 Table of Contents
1. [Module Creation Rules](#module-creation-rules)
2. [API Development Standards](#api-development-standards)
3. [Database Schema Rules](#database-schema-rules)
4. [Controller Standards](#controller-standards)
5. [View Development Rules](#view-development-rules)
6. [Service Layer Guidelines](#service-layer-guidelines)
7. [Integration Rules](#integration-rules)
8. [Code Style & Conventions](#code-style--conventions)
9. [Testing Requirements](#testing-requirements)
10. [Documentation Standards](#documentation-standards)

---

## Module Creation Rules

### Rule 1: Module Structure
Every new module **MUST** follow this structure:

```
modules/[module-name]/
├── controllers/
│   └── [Feature]Controller.js
├── models/
│   └── [Model].js
├── routes/
│   └── [feature].js
├── services/          (optional, for complex logic)
│   └── [Service].js
├── middleware/        (optional, module-specific)
│   └── [middleware].js
└── views/            (optional, if has admin UI)
    └── [view].ejs
```

### Rule 2: Module Naming Conventions
- **Module folder**: `kebab-case` (e.g., `user-management`, `trip-management`)
- **Controllers**: `PascalCase` + `Controller` suffix (e.g., `UserController.js`)
- **Models**: `PascalCase` singular (e.g., `User.js`, `School.js`)
- **Routes**: `lowercase` plural (e.g., `users.js`, `schools.js`)
- **Services**: `PascalCase` + `Service` suffix (e.g., `GoogleMapsService.js`)

### Rule 3: Module Registration
After creating a module, register it in `app.js`:

```javascript
// In app.js
app.use('/api/[resource]', require('./modules/[module-name]/routes/[resource]'));
```

**Location in app.js**: After line ~90, in the API routes section

### Rule 4: Admin View Registration
If module has admin views, register route in `routes/admin.js`:

```javascript
router.get('/[feature]', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/[feature]/index', {
    title: '[Feature] Management - UGO Admin',
    user: req.user,
    currentPath: '/[feature]'
  });
});
```

### Rule 5: Sidebar Menu Addition
Add menu item to `views/admin/components/sidebar.ejs`:

```html
<li class="nav-item">
    <a class="nav-link <%= isActive('/[feature]') ? 'active' : '' %>" href="/admin/[feature]">
        <i class="fas fa-[icon]"></i> [Feature Name]
    </a>
</li>
```

---

## API Development Standards

### Rule 6: RESTful Endpoint Naming
**ALWAYS** follow REST conventions:

```
GET    /api/[resource]              - List all (with pagination)
GET    /api/[resource]/:id          - Get single item
POST   /api/[resource]              - Create new item
PUT    /api/[resource]/:id          - Update entire item
PATCH  /api/[resource]/:id          - Partial update
DELETE /api/[resource]/:id          - Delete item

# Special queries
GET    /api/[resource]/search       - Search
GET    /api/[resource]/stats        - Statistics
GET    /api/[resource]/nearby       - Geospatial query

# Actions on specific item
POST   /api/[resource]/:id/[action] - Custom action
PATCH  /api/[resource]/:id/status   - Toggle status
```

### Rule 7: Response Format
**ALL** API responses **MUST** follow this format:

**Success**:
```javascript
res.status(200).json({
  success: true,
  message: 'Operation successful',  // Optional
  data: {
    [resource]: { /* ... */ },
    pagination: { /* ... */ }       // For list endpoints
  }
});
```

**Error**:
```javascript
res.status(400).json({
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable error message',
    details: { /* ... */ }          // Optional
  }
});
```

### Rule 8: HTTP Status Codes
Use appropriate status codes:
- `200` - Success (GET, PUT, PATCH)
- `201` - Created (POST)
- `204` - No Content (DELETE success)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Internal Server Error

### Rule 9: Swagger Documentation
**EVERY** API endpoint **MUST** have Swagger documentation:

```javascript
/**
 * @swagger
 * /api/[resource]:
 *   get:
 *     summary: Brief description
 *     tags: [[Resource]]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *       400:
 *         description: Error response
 */
router.get('/', authenticate, Controller.method);
```

### Rule 10: Authentication Middleware
Apply authentication based on endpoint visibility:

```javascript
// Public endpoint (no auth)
router.post('/login', AuthController.login);

// Protected endpoint (auth required)
router.get('/', authenticate, Controller.getAll);

// Admin-only endpoint
router.delete('/:id', authenticate, adminOnly, Controller.delete);
```

---

## Database Schema Rules

### Rule 11: Schema Structure
Every schema **MUST** include:

```javascript
const mongoose = require('mongoose');

const [model]Schema = new mongoose.Schema({
  // Required fields first
  name: { type: String, required: true, trim: true },
  
  // Optional fields
  description: { type: String },
  
  // Status fields
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  
  // Audit fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: Date,
  
  // Metadata (optional)
  metadata: mongoose.Schema.Types.Mixed
  
}, { 
  timestamps: true  // ALWAYS include timestamps
});

// Indexes
[model]Schema.index({ name: 1 });
[model]Schema.index({ isDeleted: 1, isActive: 1 });

// Static methods
[model]Schema.statics.findActive = function() {
  return this.find({ isDeleted: false, isActive: true });
};

module.exports = mongoose.model('[Model]', [model]Schema);
```

### Rule 12: Geospatial Data
For location-based features, **ALWAYS** use this pattern:

```javascript
{
  // Store both formats for flexibility
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  
  // GeoJSON for MongoDB geospatial queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
}

// Index for geospatial queries
schema.index({ location: '2dsphere' });

// Static method for nearby search
schema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: maxDistance
      }
    }
  });
};
```

### Rule 13: Flexible Configuration Fields
For settings/configuration, use Mixed type:

```javascript
{
  value: mongoose.Schema.Types.Mixed,
  liveValues: mongoose.Schema.Types.Mixed,
  testValues: mongoose.Schema.Types.Mixed,
  mode: { type: String, enum: ['live', 'test'], default: 'test' }
}
```

### Rule 14: Validation Rules
Add validation at schema level:

```javascript
{
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  }
}
```

---

## Controller Standards

### Rule 15: Controller Structure
Controllers **MUST** be static classes with standard methods:

```javascript
const [Model] = require('../models/[Model]');

class [Feature]Controller {
  // List all (with pagination)
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search, filter } = req.query;
      
      const query = { isDeleted: false };
      if (search) query.name = new RegExp(search, 'i');
      if (filter) query.status = filter;
      
      const items = await [Model]
        .find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      
      const total = await [Model].countDocuments(query);
      
      res.json({
        success: true,
        data: {
          items,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get all error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch items'
        }
      });
    }
  }
  
  // Get single item
  static async getOne(req, res) { /* ... */ }
  
  // Create new item
  static async create(req, res) { /* ... */ }
  
  // Update item
  static async update(req, res) { /* ... */ }
  
  // Delete item
  static async delete(req, res) { /* ... */ }
  
  // Custom methods
  static async toggleStatus(req, res) { /* ... */ }
  static async getStats(req, res) { /* ... */ }
}

module.exports = [Feature]Controller;
```

### Rule 16: Error Handling
**ALWAYS** wrap controller methods in try-catch:

```javascript
static async methodName(req, res) {
  try {
    // Logic here
  } catch (error) {
    console.error('Method error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'OPERATION_FAILED',
        message: 'Failed to perform operation'
      }
    });
  }
}
```

### Rule 17: Input Validation
Validate inputs at the start of controller methods:

```javascript
static async create(req, res) {
  try {
    const { name, email } = req.body;
    
    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and email are required'
        }
      });
    }
    
    // Continue with logic...
  } catch (error) { /* ... */ }
}
```

### Rule 18: Audit Trail
Add audit fields when creating/updating:

```javascript
const item = new Model({
  ...data,
  createdBy: req.user?._id
});

// For updates
const updated = await Model.findByIdAndUpdate(
  id,
  { ...data, updatedBy: req.user?._id },
  { new: true }
);
```

---

## View Development Rules

### Rule 19: View File Structure
Each feature view folder **MUST** have:

```
views/admin/views/[feature]/
├── index.ejs              # Main list/table view
└── partials/
    ├── edit-modal.ejs     # Create/Edit modal
    └── view-modal.ejs     # View details modal
```

### Rule 20: View Template Pattern
Every index.ejs **MUST** follow this pattern:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><%= title %></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        /* Component-specific styles */
    </style>
</head>
<body>
    <%- include('../../components/sidebar') %>

    <div class="main">
        <!-- Page header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <div class="page-title">[Feature] Management</div>
                <div class="text-muted small">Description</div>
            </div>
        </div>

        <!-- Main content card -->
        <div class="card-panel">
            <div class="toolbar">
                <!-- Search, filters, actions -->
            </div>

            <div class="table-responsive">
                <table class="table">
                    <!-- Table structure -->
                </table>
            </div>
        </div>
    </div>

    <!-- Include modals -->
    <%- include('./partials/edit-modal') %>
    <%- include('./partials/view-modal') %>

    <div class="toast-container" id="toastContainer"></div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const API = '/api/[resource]';
        let allItems = [];

        // Standard functions: showToast, loadItems, renderItems, CRUD operations
        
        // Initialize
        loadItems();
    </script>
</body>
</html>
```

### Rule 21: Client-Side JavaScript Pattern
**ALWAYS** include these standard functions:

```javascript
// Toast notifications
function showToast(msg, type = 'success') {
    const id = 't' + Date.now();
    document.getElementById('toastContainer').insertAdjacentHTML('beforeend',
        `<div id="${id}" class="toast align-items-center text-bg-${type} border-0 show" role="alert">
            <div class="d-flex"><div class="toast-body">${msg}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`);
    setTimeout(() => document.getElementById(id)?.remove(), 4000);
}

// Load data from API
async function loadItems() {
    try {
        const res = await fetch(API, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
            allItems = data.data.items;
            renderItems();
        } else {
            showToast('Failed to load items', 'danger');
        }
    } catch (error) {
        console.error('Load error:', error);
        showToast('Failed to load items', 'danger');
    }
}

// Render items to DOM
function renderItems() {
    const tbody = document.getElementById('tableBody');
    if (allItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="X" class="empty-state">No items found</td></tr>';
        return;
    }
    tbody.innerHTML = allItems.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editItem('${item._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// CRUD operations
async function createItem() { /* ... */ }
async function editItem(id) { /* ... */ }
async function deleteItem(id) { /* ... */ }
```

### Rule 22: Modal Pattern
Edit modals **MUST** follow this pattern:

```html
<div class="modal fade" id="editModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editModalTitle">Add Item</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="editForm">
                    <input type="hidden" id="editId">
                    <!-- Form fields -->
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveItem()">Save</button>
            </div>
        </div>
    </div>
</div>
```

---

## Service Layer Guidelines

### Rule 23: When to Create a Service
Create a service when:
- Logic is complex and reusable
- Integrating with third-party APIs
- Business logic spans multiple models
- Need to share logic across controllers

### Rule 24: Service Structure
Services **MUST** be static classes:

```javascript
const Setting = require('../models/Setting');

class [Feature]Service {
  // Get configuration from database
  static async getConfig() {
    const integration = await Setting.findOne({ keyName: '[key]' });
    if (!integration || !integration.isActive) {
      throw new Error('Integration not configured');
    }
    return integration.value;
  }
  
  // Business logic methods
  static async performAction(params) {
    const config = await this.getConfig();
    // Use config to perform action
    return result;
  }
}

module.exports = [Feature]Service;
```

---

## Integration Rules

### Rule 25: Third-Party Integration Pattern
**ALL** third-party integrations **MUST**:

1. Store configuration in `settings` collection
2. Have a service class in `modules/integrations/services/`
3. Fetch API keys from database, never hardcode
4. Support live/test modes
5. Have a test method

**Example**:
```javascript
// Store in database
{
  keyName: 'google_maps',
  settingsType: 'map_api',
  value: {
    api_key: 'AIza...',
    enable_places: true
  },
  mode: 'live',
  isActive: true
}

// Service class
class GoogleMapsService {
  static async getAPIKey() {
    const integration = await Setting.findOne({ keyName: 'google_maps' });
    return integration.value.api_key;
  }
  
  static async geocode(address) {
    const apiKey = await this.getAPIKey();
    // Use apiKey for API call
  }
}
```

### Rule 26: Integration Testing
Every integration **MUST** have a test method in `IntegrationController`:

```javascript
static async test[Integration]API(config, testResult) {
  try {
    // Test actual API call
    const result = await [Service].validateAPIKey();
    
    if (result.valid) {
      testResult.status = 'success';
      testResult.message = 'API is working correctly';
    } else {
      testResult.status = 'failed';
      testResult.message = result.message;
    }
  } catch (error) {
    testResult.status = 'failed';
    testResult.message = error.message;
  }
  return testResult;
}
```

---

## Code Style & Conventions

### Rule 27: Naming Conventions
- **Variables**: `camelCase` (e.g., `userName`, `apiKey`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_LIMIT`, `API_URL`)
- **Functions**: `camelCase` (e.g., `getUserById`, `calculateTotal`)
- **Classes**: `PascalCase` (e.g., `UserController`, `GoogleMapsService`)
- **Files**: Match class name (e.g., `UserController.js`, `User.js`)
- **Routes**: `lowercase` plural (e.g., `users.js`, `schools.js`)

### Rule 28: Code Organization
```javascript
// 1. Imports (external first, then internal)
const express = require('express');
const mongoose = require('mongoose');
const UserController = require('../controllers/UserController');

// 2. Constants
const MAX_LIMIT = 100;
const DEFAULT_PAGE = 1;

// 3. Main code
class MyClass {
  // Static methods first
  static async method1() { }
  
  // Instance methods
  async method2() { }
}

// 4. Export
module.exports = MyClass;
```

### Rule 29: Comments
Add comments for:
- Complex logic
- Business rules
- API integrations
- Workarounds

```javascript
// Calculate distance using Haversine formula
const distance = calculateDistance(lat1, lng1, lat2, lng2);

// FIXME: This is a temporary workaround for API limitation
// TODO: Implement proper error handling
```

### Rule 30: Console Logging
Use appropriate log levels:
```javascript
console.log('Info message');      // General info
console.error('Error:', error);   // Errors
console.warn('Warning message');  // Warnings
```

**Never** log sensitive data (passwords, API keys, tokens)

---

## Testing Requirements

### Rule 31: Manual Testing Checklist
Before committing, test:
- ✅ Create operation
- ✅ Read/List operation
- ✅ Update operation
- ✅ Delete operation
- ✅ Search/Filter functionality
- ✅ Pagination
- ✅ Error handling
- ✅ Authentication
- ✅ Authorization

### Rule 32: API Testing
Use Swagger UI or create test scripts:
```javascript
// test-[feature].js
async function testCreate() {
  const response = await fetch('http://localhost:3001/api/[resource]', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* test data */ })
  });
  const result = await response.json();
  console.log('Create result:', result);
}
```

---

## Documentation Standards

### Rule 33: README Updates
When adding a new module, update `README.md`:
```markdown
## Modules
- **[Module Name]**: Description of what it does
```

### Rule 34: Swagger Tags
Group related endpoints with tags:
```javascript
/**
 * @swagger
 * tags:
 *   name: [Resource]
 *   description: [Resource] management endpoints
 */
```

### Rule 35: Code Documentation
Document complex functions:
```javascript
/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  // Implementation
}
```

---

## Summary Checklist

When creating a new feature, ensure:
- [ ] Module structure follows standard pattern
- [ ] Model has timestamps, audit fields, indexes
- [ ] Controller has all CRUD methods with error handling
- [ ] Routes have Swagger documentation
- [ ] API responses follow standard format
- [ ] Authentication middleware applied correctly
- [ ] Views follow template pattern
- [ ] Client-side JavaScript includes standard functions
- [ ] Third-party integrations use service layer
- [ ] Code follows naming conventions
- [ ] Manual testing completed
- [ ] Documentation updated

---

**These rules are mandatory for all development work on the UGO Admin system.**
