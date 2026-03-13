# UGO Admin System - Workflow for Adding New Features

## 📋 Table of Contents
1. [Quick Reference](#quick-reference)
2. [Workflow 1: Adding a New Module](#workflow-1-adding-a-new-module)
3. [Workflow 2: Adding New API Endpoints](#workflow-2-adding-new-api-endpoints)
4. [Workflow 3: Adding Admin Views](#workflow-3-adding-admin-views)
5. [Workflow 4: Integrating Third-Party Services](#workflow-4-integrating-third-party-services)
6. [Workflow 5: Adding Database Models](#workflow-5-adding-database-models)
7. [Workflow 6: Adding Geospatial Features](#workflow-6-adding-geospatial-features)
8. [Common Patterns & Examples](#common-patterns--examples)

---

## Quick Reference

### File Locations Quick Guide
```
New API Route       → modules/[module]/routes/[resource].js
Controller          → modules/[module]/controllers/[Feature]Controller.js
Model               → modules/[module]/models/[Model].js
Service             → modules/integrations/services/[Service].js
Admin View          → views/admin/views/[feature]/index.ejs
Route Registration  → app.js (line ~90)
Admin Route         → routes/admin.js
Sidebar Menu        → views/admin/components/sidebar.ejs
```

### Common Commands
```bash
# Start server
node app.js

# Test API
node test-[feature].js

# Check MongoDB
mongosh ugo

# View logs
tail -f logs/app.log
```

---

## Workflow 1: Adding a New Module

### Step-by-Step Process

#### Step 1: Create Module Structure
```bash
mkdir -p modules/[module-name]/controllers
mkdir -p modules/[module-name]/models
mkdir -p modules/[module-name]/routes
mkdir -p modules/[module-name]/services  # Optional
```

**Example**: Creating a "Vehicles" module
```bash
mkdir -p modules/vehicles/controllers
mkdir -p modules/vehicles/models
mkdir -p modules/vehicles/routes
```

#### Step 2: Create the Model
**File**: `modules/[module-name]/models/[Model].js`

```javascript
const mongoose = require('mongoose');

const [model]Schema = new mongoose.Schema({
  // Required fields
  name: { type: String, required: true, trim: true },
  
  // Optional fields
  description: String,
  
  // Status fields
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  
  // Audit fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: Date,
  
  // Additional fields specific to your feature
  // ...
  
}, { timestamps: true });

// Indexes
[model]Schema.index({ name: 1 });
[model]Schema.index({ isDeleted: 1, isActive: 1 });

// Static methods
[model]Schema.statics.findActive = function() {
  return this.find({ isDeleted: false, isActive: true });
};

module.exports = mongoose.model('[Model]', [model]Schema);
```

**Example**: Vehicle model
```javascript
const vehicleSchema = new mongoose.Schema({
  licensePlate: { type: String, required: true, unique: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  capacity: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
```

#### Step 3: Create the Controller
**File**: `modules/[module-name]/controllers/[Feature]Controller.js`

```javascript
const [Model] = require('../models/[Model]');

class [Feature]Controller {
  // Get all items
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const query = { isDeleted: false };
      
      if (search) {
        query.name = new RegExp(search, 'i');
      }
      
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
  static async getOne(req, res) {
    try {
      const { id } = req.params;
      const item = await [Model].findById(id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Item not found'
          }
        });
      }
      
      res.json({
        success: true,
        data: { item }
      });
    } catch (error) {
      console.error('Get one error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch item'
        }
      });
    }
  }
  
  // Create new item
  static async create(req, res) {
    try {
      const data = req.body;
      
      // Validation
      if (!data.name) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name is required'
          }
        });
      }
      
      const item = new [Model]({
        ...data,
        createdBy: req.user?._id
      });
      
      await item.save();
      
      res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: { item }
      });
    } catch (error) {
      console.error('Create error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: 'Failed to create item'
        }
      });
    }
  }
  
  // Update item
  static async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const item = await [Model].findByIdAndUpdate(
        id,
        { ...data, updatedBy: req.user?._id },
        { new: true, runValidators: true }
      );
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Item not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Item updated successfully',
        data: { item }
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update item'
        }
      });
    }
  }
  
  // Delete item
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const item = await [Model].findByIdAndDelete(id);
      
      if (!item) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Item not found'
          }
        });
      }
      
      res.json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete item'
        }
      });
    }
  }
  
  // Get statistics
  static async getStats(req, res) {
    try {
      const total = await [Model].countDocuments({ isDeleted: false });
      const active = await [Model].countDocuments({ isDeleted: false, isActive: true });
      
      res.json({
        success: true,
        data: {
          total,
          active,
          inactive: total - active
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: 'Failed to fetch statistics'
        }
      });
    }
  }
}

module.exports = [Feature]Controller;
```

#### Step 4: Create Routes
**File**: `modules/[module-name]/routes/[resource].js`

```javascript
const express = require('express');
const router = express.Router();
const [Feature]Controller = require('../controllers/[Feature]Controller');
const { authenticate } = require('../../auth/middleware/auth');

/**
 * @swagger
 * tags:
 *   name: [Resource]
 *   description: [Resource] management endpoints
 */

/**
 * @swagger
 * /api/[resource]:
 *   get:
 *     summary: Get all [resource]
 *     tags: [[Resource]]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of [resource]
 */
router.get('/', authenticate, [Feature]Controller.getAll);

/**
 * @swagger
 * /api/[resource]/stats:
 *   get:
 *     summary: Get [resource] statistics
 *     tags: [[Resource]]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 */
router.get('/stats', authenticate, [Feature]Controller.getStats);

/**
 * @swagger
 * /api/[resource]/{id}:
 *   get:
 *     summary: Get [resource] by ID
 *     tags: [[Resource]]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: [Resource] details
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, [Feature]Controller.getOne);

/**
 * @swagger
 * /api/[resource]:
 *   post:
 *     summary: Create new [resource]
 *     tags: [[Resource]]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created successfully
 */
router.post('/', authenticate, [Feature]Controller.create);

/**
 * @swagger
 * /api/[resource]/{id}:
 *   put:
 *     summary: Update [resource]
 *     tags: [[Resource]]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put('/:id', authenticate, [Feature]Controller.update);

/**
 * @swagger
 * /api/[resource]/{id}:
 *   delete:
 *     summary: Delete [resource]
 *     tags: [[Resource]]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 */
router.delete('/:id', authenticate, [Feature]Controller.delete);

module.exports = router;
```

#### Step 5: Register Routes in app.js
**File**: `app.js` (around line 90)

```javascript
// Add this line with other API routes
app.use('/api/[resource]', require('./modules/[module-name]/routes/[resource]'));
```

**Example**:
```javascript
app.use('/api/vehicles', require('./modules/vehicles/routes/vehicles'));
```

#### Step 6: Test the API
Create a test file: `test-[feature].js`

```javascript
async function testAPI() {
  console.log('=== Testing [Feature] API ===\n');
  
  // Test create
  console.log('1. Testing CREATE...');
  const createRes = await fetch('http://localhost:3001/api/[resource]', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: 'Test Item',
      // other fields
    })
  });
  const createData = await createRes.json();
  console.log('Create result:', createData);
  
  // Test get all
  console.log('\n2. Testing GET ALL...');
  const getAllRes = await fetch('http://localhost:3001/api/[resource]', {
    credentials: 'include'
  });
  const getAllData = await getAllRes.json();
  console.log('Get all result:', getAllData);
  
  console.log('\n=== Tests Complete ===');
}

testAPI();
```

Run: `node test-[feature].js`

---

## Workflow 2: Adding New API Endpoints

### When to Add New Endpoints
- Custom actions on resources (e.g., `/approve`, `/publish`)
- Special queries (e.g., `/nearby`, `/search`)
- Bulk operations (e.g., `/bulk-delete`)
- Reports and statistics (e.g., `/stats`, `/report`)

### Step-by-Step Process

#### Step 1: Add Controller Method
**File**: `modules/[module]/controllers/[Feature]Controller.js`

```javascript
// Add new method to existing controller
static async customAction(req, res) {
  try {
    const { id } = req.params;
    const { param1, param2 } = req.body;
    
    // Your logic here
    const result = await [Model].findById(id);
    
    // Perform action
    result.status = 'approved';
    await result.save();
    
    res.json({
      success: true,
      message: 'Action completed successfully',
      data: { result }
    });
  } catch (error) {
    console.error('Custom action error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTION_FAILED',
        message: 'Failed to perform action'
      }
    });
  }
}
```

#### Step 2: Add Route
**File**: `modules/[module]/routes/[resource].js`

```javascript
/**
 * @swagger
 * /api/[resource]/{id}/[action]:
 *   post:
 *     summary: Perform custom action
 *     tags: [[Resource]]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               param1:
 *                 type: string
 *     responses:
 *       200:
 *         description: Action completed
 */
router.post('/:id/[action]', authenticate, [Feature]Controller.customAction);
```

#### Step 3: Test the Endpoint
```javascript
const response = await fetch('http://localhost:3001/api/[resource]/123/[action]', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ param1: 'value' })
});
```

---

## Workflow 3: Adding Admin Views

### Step-by-Step Process

#### Step 1: Create View Folder Structure
```bash
mkdir -p views/admin/views/[feature]
mkdir -p views/admin/views/[feature]/partials
```

#### Step 2: Create Main View
**File**: `views/admin/views/[feature]/index.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root { --sidebar-w: 260px; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; margin-left: var(--sidebar-w); }
        .main { padding: 2rem; min-height: 100vh; max-width: 1400px; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #1a1d29; }
        .card-panel { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin-bottom: 1.5rem; }
        .toolbar { padding: 1rem 1.5rem; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .table th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; font-weight: 600; }
        .empty-state { text-align: center; padding: 3rem; color: #6c757d; }
        .toast-container { position: fixed; top: 1rem; right: 1rem; z-index: 9999; }
    </style>
</head>
<body>
    <%- include('../../components/sidebar') %>

    <div class="main">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <div class="page-title">[Feature] Management</div>
                <div class="text-muted small">Manage [feature] items</div>
            </div>
        </div>

        <div class="card-panel">
            <div class="toolbar">
                <div class="input-group" style="max-width: 280px;">
                    <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
                    <input type="text" class="form-control border-start-0" placeholder="Search..." id="searchInput">
                </div>
                <div class="ms-auto d-flex gap-2">
                    <button class="btn btn-sm btn-success" onclick="showAddModal()">
                        <i class="fas fa-plus me-1"></i>Add New
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="loadItems()" title="Refresh">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th style="width:140px">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                        <tr><td colspan="3" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <%- include('./partials/edit-modal') %>

    <div class="toast-container" id="toastContainer"></div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
    const API = '/api/[resource]';
    let allItems = [];

    function showToast(msg, type = 'success') {
        const id = 't' + Date.now();
        document.getElementById('toastContainer').insertAdjacentHTML('beforeend',
            `<div id="${id}" class="toast align-items-center text-bg-${type} border-0 show" role="alert">
                <div class="d-flex"><div class="toast-body">${msg}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>`);
        setTimeout(() => document.getElementById(id)?.remove(), 4000);
    }

    async function loadItems() {
        try {
            const search = document.getElementById('searchInput').value;
            let url = API;
            if (search) url += `?search=${encodeURIComponent(search)}`;
            
            const res = await fetch(url, { credentials: 'include' });
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

    function renderItems() {
        const tbody = document.getElementById('tableBody');
        
        if (allItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No items found</td></tr>';
            return;
        }

        tbody.innerHTML = allItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>
                    ${item.isActive ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'}
                </td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" onclick="editItem('${item._id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${item._id}', '${item.name}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function showAddModal() {
        document.getElementById('editModalTitle').textContent = 'Add New Item';
        document.getElementById('editForm').reset();
        document.getElementById('editId').value = '';
        new bootstrap.Modal(document.getElementById('editModal')).show();
    }

    async function editItem(id) {
        try {
            const res = await fetch(`${API}/${id}`, { credentials: 'include' });
            const data = await res.json();
            
            if (data.success) {
                const item = data.data.item;
                document.getElementById('editModalTitle').textContent = 'Edit Item';
                document.getElementById('editId').value = item._id;
                document.getElementById('editName').value = item.name;
                // Set other fields...
                
                new bootstrap.Modal(document.getElementById('editModal')).show();
            }
        } catch (error) {
            console.error('Edit error:', error);
            showToast('Failed to load item', 'danger');
        }
    }

    async function saveItem() {
        const form = document.getElementById('editForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('editId').value;
        const data = {
            name: document.getElementById('editName').value,
            // other fields...
        };

        try {
            const url = id ? `${API}/${id}` : API;
            const method = id ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (result.success) {
                showToast(id ? 'Item updated successfully' : 'Item created successfully');
                bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
                loadItems();
            } else {
                showToast(result.error?.message || 'Save failed', 'danger');
            }
        } catch (error) {
            console.error('Save error:', error);
            showToast('Failed to save item', 'danger');
        }
    }

    async function deleteItem(id, name) {
        if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
        
        try {
            const res = await fetch(`${API}/${id}`, { 
                method: 'DELETE', 
                credentials: 'include' 
            });
            const data = await res.json();
            
            if (data.success) {
                showToast('Item deleted successfully');
                loadItems();
            } else {
                showToast(data.error?.message || 'Delete failed', 'danger');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Failed to delete item', 'danger');
        }
    }

    document.getElementById('searchInput').addEventListener('input', () => setTimeout(loadItems, 300));

    loadItems();
    </script>
</body>
</html>
```

#### Step 3: Create Edit Modal
**File**: `views/admin/views/[feature]/partials/edit-modal.ejs`

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
                    
                    <div class="mb-3">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-control" id="editName" required>
                    </div>
                    
                    <!-- Add more fields as needed -->
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveItem()">
                    <i class="fas fa-save me-1"></i>Save
                </button>
            </div>
        </div>
    </div>
</div>
```

#### Step 4: Register Admin Route
**File**: `routes/admin.js`

```javascript
// Add this route
router.get('/[feature]', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/[feature]/index', {
    title: '[Feature] Management - UGO Admin',
    user: req.user,
    currentPath: '/[feature]'
  });
});
```

#### Step 5: Add to Sidebar
**File**: `views/admin/components/sidebar.ejs`

Find the appropriate section and add:
```html
<li class="nav-item">
    <a class="nav-link <%= isActive('/[feature]') ? 'active' : '' %>" href="/admin/[feature]">
        <i class="fas fa-[icon]"></i> [Feature Name]
    </a>
</li>
```

---

## Workflow 4: Integrating Third-Party Services

### Step-by-Step Process

#### Step 1: Add Integration to Database
Create migration file: `modules/integrations/migrations/init-[service].js`

```javascript
const Setting = require('../models/Setting');

async function initializeService() {
  try {
    const existing = await Setting.findOne({ keyName: '[service_key]' });
    
    if (!existing) {
      await Setting.create({
        keyName: '[service_key]',
        settingsType: '[type]',  // e.g., 'sms_gateway', 'payment_gateway'
        description: '[Service] integration',
        value: {
          api_key: '',
          // other config fields
        },
        mode: 'test',
        isActive: false
      });
      console.log('[Service] integration initialized');
    }
  } catch (error) {
    console.error('Failed to initialize [service]:', error);
  }
}

module.exports = initializeService;
```

#### Step 2: Create Service Class
**File**: `modules/integrations/services/[Service]Service.js`

```javascript
const Setting = require('../models/Setting');

class [Service]Service {
  // Get API key from database
  static async getAPIKey() {
    try {
      const integration = await Setting.findOne({ keyName: '[service_key]' });
      
      if (!integration || !integration.isActive) {
        throw new Error('[Service] integration not configured');
      }
      
      // Get config based on mode
      const config = integration.mode === 'live' ? integration.liveValues : integration.testValues || integration.value;
      
      if (!config?.api_key) {
        throw new Error('[Service] API key not configured');
      }
      
      return config.api_key;
    } catch (error) {
      console.error('Failed to get [Service] API key:', error);
      throw error;
    }
  }
  
  // Get full configuration
  static async getConfig() {
    try {
      const integration = await Setting.findOne({ keyName: '[service_key]' });
      
      if (!integration || !integration.isActive) {
        throw new Error('[Service] integration not configured');
      }
      
      const config = integration.mode === 'live' ? integration.liveValues : integration.testValues || integration.value;
      
      return {
        apiKey: config.api_key,
        // other config fields
      };
    } catch (error) {
      console.error('Failed to get [Service] config:', error);
      throw error;
    }
  }
  
  // Service-specific methods
  static async performAction(params) {
    try {
      const config = await this.getConfig();
      
      // Use config to call external API
      const response = await fetch('[API_URL]', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          data: data.result
        };
      } else {
        throw new Error(data.error || 'API call failed');
      }
    } catch (error) {
      console.error('[Service] action error:', error);
      throw error;
    }
  }
  
  // Validate API key
  static async validateAPIKey() {
    try {
      const config = await this.getConfig();
      
      // Test API call
      const response = await fetch('[API_TEST_URL]', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });
      
      if (response.ok) {
        return {
          valid: true,
          message: 'API key is valid'
        };
      } else {
        return {
          valid: false,
          message: 'API key is invalid'
        };
      }
    } catch (error) {
      return {
        valid: false,
        message: error.message
      };
    }
  }
}

module.exports = [Service]Service;
```

#### Step 3: Add Test Method to IntegrationController
**File**: `modules/integrations/controllers/IntegrationController.js`

```javascript
// Add this method to the switch statement in test()
case '[type]':
  testResult = await this.test[Service]API(config, testResult);
  break;

// Add test method
static async test[Service]API(config, testResult) {
  try {
    const [Service]Service = require('../services/[Service]Service');
    
    const validation = await [Service]Service.validateAPIKey();
    
    if (validation.valid) {
      testResult.status = 'success';
      testResult.message = '[Service] API is working correctly';
      testResult.details = {
        api_key_configured: !!config.api_key,
        validation_message: validation.message
      };
    } else {
      testResult.status = 'failed';
      testResult.message = validation.message;
      testResult.details = {
        error: validation.message
      };
    }
  } catch (error) {
    testResult.status = 'failed';
    testResult.message = 'Failed to test [Service] API';
    testResult.details = { error: error.message };
  }
  
  return testResult;
}
```

#### Step 4: Use Service in Controllers
```javascript
const [Service]Service = require('../../integrations/services/[Service]Service');

class MyController {
  static async myMethod(req, res) {
    try {
      // Use the service
      const result = await [Service]Service.performAction(params);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: error.message
        }
      });
    }
  }
}
```

#### Step 5: Initialize on Server Start
**File**: `app.js`

```javascript
// Add to initialization section
const init[Service] = require('./modules/integrations/migrations/init-[service]');
await init[Service]();
```

---

## Workflow 5: Adding Database Models

### Step-by-Step Process

#### Step 1: Define Schema
**File**: `modules/[module]/models/[Model].js`

```javascript
const mongoose = require('mongoose');

const [model]Schema = new mongoose.Schema({
  // Define fields with validation
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  
  // Enum field
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  
  // Number with range
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  
  // Reference to another model
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Array of strings
  tags: [String],
  
  // Nested object
  address: {
    street: String,
    city: String,
    country: { type: String, default: 'Ethiopia' }
  },
  
  // Mixed type for flexible data
  metadata: mongoose.Schema.Types.Mixed,
  
  // Standard fields
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
[model]Schema.index({ name: 1 });
[model]Schema.index({ email: 1 }, { unique: true });
[model]Schema.index({ isDeleted: 1, isActive: 1 });
[model]Schema.index({ createdAt: -1 });

// Virtual fields
[model]Schema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Instance methods
[model]Schema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Static methods
[model]Schema.statics.findActive = function() {
  return this.find({ isDeleted: false, isActive: true });
};

[model]Schema.statics.search = function(query) {
  return this.find({
    $or: [
      { name: new RegExp(query, 'i') },
      { email: new RegExp(query, 'i') }
    ],
    isDeleted: false
  });
};

// Pre-save hook
[model]Schema.pre('save', async function(next) {
  // Do something before saving
  next();
});

// Post-save hook
[model]Schema.post('save', function(doc) {
  // Do something after saving
  console.log('Document saved:', doc._id);
});

module.exports = mongoose.model('[Model]', [model]Schema);
```

#### Step 2: Test Model
Create test file: `test-[model].js`

```javascript
const mongoose = require('mongoose');
const [Model] = require('./modules/[module]/models/[Model]');

mongoose.connect('mongodb://localhost:27017/ugo')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Test create
    const item = new [Model]({
      name: 'Test Item',
      // other fields
    });
    
    await item.save();
    console.log('Created:', item);
    
    // Test find
    const found = await [Model].findById(item._id);
    console.log('Found:', found);
    
    // Test static method
    const active = await [Model].findActive();
    console.log('Active items:', active.length);
    
    mongoose.connection.close();
  })
  .catch(err => console.error('Error:', err));
```

---

## Workflow 6: Adding Geospatial Features

### Step-by-Step Process

#### Step 1: Add Location Fields to Model
```javascript
const [model]Schema = new mongoose.Schema({
  // Store both formats
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  
  // GeoJSON for MongoDB geospatial queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  
  // Optional: service radius
  serviceRadius: { type: Number, default: 5000 }, // in meters
  
  // Address details
  address: {
    street: String,
    city: String,
    region: String,
    country: { type: String, default: 'Ethiopia' },
    formattedAddress: String
  }
});

// Geospatial index
[model]Schema.index({ location: '2dsphere' });

// Static method for nearby search
[model]Schema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: maxDistance
      }
    },
    isDeleted: false,
    isActive: true
  });
};

// Pre-save: sync coordinates with location
[model]Schema.pre('save', function(next) {
  if (this.latitude && this.longitude) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  next();
});
```

#### Step 2: Add Geocoding in Controller
```javascript
const GoogleMapsService = require('../../integrations/services/GoogleMapsService');

static async create(req, res) {
  try {
    const { name, address, latitude, longitude } = req.body;
    
    let finalLat = latitude;
    let finalLng = longitude;
    let formattedAddress = address?.formattedAddress;
    
    // If only address provided, geocode it
    if (!latitude || !longitude) {
      if (!address || !address.street) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either coordinates or street address is required'
          }
        });
      }
      
      try {
        const geocodeResult = await GoogleMapsService.geocode(
          `${address.street}, ${address.city || 'Addis Ababa'}, ${address.country || 'Ethiopia'}`
        );
        
        if (geocodeResult.success) {
          finalLat = geocodeResult.location.lat;
          finalLng = geocodeResult.location.lng;
          formattedAddress = geocodeResult.formattedAddress;
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'GEOCODING_ERROR',
            message: 'Failed to geocode address'
          }
        });
      }
    }
    
    const item = new [Model]({
      name,
      latitude: finalLat,
      longitude: finalLng,
      location: {
        type: 'Point',
        coordinates: [finalLng, finalLat]
      },
      address: {
        ...address,
        formattedAddress
      }
    });
    
    await item.save();
    
    res.status(201).json({
      success: true,
      data: { item }
    });
  } catch (error) {
    // Error handling
  }
}
```

#### Step 3: Add Nearby Search Endpoint
```javascript
static async findNearby(req, res) {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Latitude and longitude are required'
        }
      });
    }
    
    const maxDistance = parseFloat(radius) * 1000; // Convert km to meters
    
    const items = await [Model].findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      maxDistance
    );
    
    res.json({
      success: true,
      data: {
        items,
        total: items.length,
        center: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        radius: maxDistance / 1000
      }
    });
  } catch (error) {
    // Error handling
  }
}
```

#### Step 4: Add Google Maps to View
```javascript
// Load Google Maps API key
async function loadGoogleMapsKey() {
  const res = await fetch('/api/integrations/google_maps', { credentials: 'include' });
  const data = await res.json();
  if (data.success && data.data.integration.value?.api_key) {
    googleMapsApiKey = data.data.integration.value.api_key;
    initMap();
  }
}

// Initialize map
function initMap(lat = 9.0192, lng = 38.7525) {
  if (!window.google) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&callback=createMap`;
    script.async = true;
    document.head.appendChild(script);
  } else {
    createMap();
  }
}

function createMap() {
  const position = { lat: 9.0192, lng: 38.7525 };
  
  map = new google.maps.Map(document.getElementById('map'), {
    center: position,
    zoom: 13
  });
  
  marker = new google.maps.Marker({
    position: position,
    map: map,
    draggable: true
  });
  
  marker.addListener('dragend', (event) => {
    document.getElementById('latitude').value = event.latLng.lat();
    document.getElementById('longitude').value = event.latLng.lng();
  });
  
  map.addListener('click', (event) => {
    marker.setPosition(event.latLng);
    document.getElementById('latitude').value = event.latLng.lat();
    document.getElementById('longitude').value = event.latLng.lng();
  });
}
```

---

## Common Patterns & Examples

### Pattern 1: Pagination
```javascript
static async getAll(req, res) {
  const { page = 1, limit = 10 } = req.query;
  
  const items = await Model
    .find({ isDeleted: false })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
  
  const total = await Model.countDocuments({ isDeleted: false });
  
  res.json({
    success: true,
    data: {
      items,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    }
  });
}
```

### Pattern 2: Search & Filter
```javascript
static async getAll(req, res) {
  const { search, status, category, page = 1, limit = 10 } = req.query;
  
  const query = { isDeleted: false };
  
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') }
    ];
  }
  
  if (status) query.status = status;
  if (category) query.category = category;
  
  const items = await Model
    .find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
  
  const total = await Model.countDocuments(query);
  
  res.json({
    success: true,
    data: { items, pagination: { total, page, pages: Math.ceil(total / limit) } }
  });
}
```

### Pattern 3: Soft Delete
```javascript
static async delete(req, res) {
  const { id } = req.params;
  
  const item = await Model.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user?._id
    },
    { new: true }
  );
  
  if (!item) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item not found' }
    });
  }
  
  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
}
```

### Pattern 4: Bulk Operations
```javascript
static async bulkDelete(req, res) {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'IDs array is required' }
    });
  }
  
  const result = await Model.updateMany(
    { _id: { $in: ids } },
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user?._id
    }
  );
  
  res.json({
    success: true,
    message: `${result.modifiedCount} items deleted successfully`,
    data: { count: result.modifiedCount }
  });
}
```

---

## Summary

This workflow document provides step-by-step instructions for:
1. ✅ Creating new modules
2. ✅ Adding API endpoints
3. ✅ Creating admin views
4. ✅ Integrating third-party services
5. ✅ Adding database models
6. ✅ Implementing geospatial features

**Always refer to existing modules (schools, integrations, user-management) as examples when implementing new features.**
