---
description: Add a new module to the UGO Admin system
---

# Add New Module Workflow

Follow these steps to add a new module to the system:

## 1. Create Module Structure
```bash
mkdir -p modules/[module-name]/controllers
mkdir -p modules/[module-name]/models
mkdir -p modules/[module-name]/routes
```

## 2. Create the Model
File: `modules/[module-name]/models/[Model].js`

Include:
- Required fields with validation
- Optional fields
- Status fields (isActive, isDeleted)
- Audit fields (createdBy, updatedBy, deletedBy, deletedAt)
- Timestamps: `{ timestamps: true }`
- Indexes for frequently queried fields
- Static methods for common queries

## 3. Create the Controller
File: `modules/[module-name]/controllers/[Feature]Controller.js`

Must include these methods:
- `getAll(req, res)` - List with pagination
- `getOne(req, res)` - Get single item
- `create(req, res)` - Create new item
- `update(req, res)` - Update item
- `delete(req, res)` - Delete item
- `getStats(req, res)` - Statistics

All methods must:
- Be wrapped in try-catch
- Validate inputs
- Return standard response format
- Include audit fields (createdBy, updatedBy)

## 4. Create Routes
File: `modules/[module-name]/routes/[resource].js`

Include:
- Import controller and authenticate middleware
- Swagger documentation for each endpoint
- Apply authentication middleware
- Export router

Standard routes:
```
GET    /api/[resource]       - List all
GET    /api/[resource]/:id   - Get one
POST   /api/[resource]       - Create
PUT    /api/[resource]/:id   - Update
DELETE /api/[resource]/:id   - Delete
GET    /api/[resource]/stats - Statistics
```

## 5. Register Routes in app.js
Location: Line ~90 in `app.js`

Add:
```javascript
app.use('/api/[resource]', require('./modules/[module-name]/routes/[resource]'));
```

## 6. Test the API
Create: `test-[feature].js`

Test:
- Create operation
- Get all operation
- Get one operation
- Update operation
- Delete operation

Run: `node test-[feature].js`

## 7. Create Admin Views (Optional)
If module needs admin interface:

a. Create view structure:
```bash
mkdir -p views/admin/views/[feature]/partials
```

b. Create `index.ejs` - Main view
c. Create `partials/edit-modal.ejs` - Edit modal
d. Register route in `routes/admin.js`
e. Add menu item to `views/admin/components/sidebar.ejs`

## Checklist
- [ ] Module structure created
- [ ] Model created with all required fields
- [ ] Controller created with all CRUD methods
- [ ] Routes created with Swagger docs
- [ ] Routes registered in app.js
- [ ] API tested successfully
- [ ] Admin views created (if needed)
- [ ] Admin route registered (if needed)
- [ ] Sidebar menu added (if needed)
- [ ] Documentation updated

## Reference
See existing modules for examples:
- `modules/schools/` - Complete module with geolocation
- `modules/integrations/` - Module with services
- `modules/user-management/` - User management module
