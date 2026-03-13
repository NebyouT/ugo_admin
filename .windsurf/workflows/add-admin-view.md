---
description: Add an admin panel view for a feature
---

# Add Admin View Workflow

Follow these steps to add an admin panel view:

## 1. Create View Structure
```bash
mkdir -p views/admin/views/[feature]/partials
```

## 2. Create Main View
File: `views/admin/views/[feature]/index.ejs`

Must include:
- Bootstrap 5.3 and Font Awesome 6.4
- Sidebar component: `<%- include('../../components/sidebar') %>`
- Page title and description
- Search and filter toolbar
- Table with data
- Action buttons (Add, Edit, Delete)
- Toast notifications container
- Modal includes

Standard structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><%= title %></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>/* Component styles */</style>
</head>
<body>
    <%- include('../../components/sidebar') %>
    <div class="main">
        <!-- Content -->
    </div>
    <%- include('./partials/edit-modal') %>
    <div class="toast-container" id="toastContainer"></div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>/* Client-side code */</script>
</body>
</html>
```

## 3. Create Edit Modal
File: `views/admin/views/[feature]/partials/edit-modal.ejs`

Must include:
- Hidden ID field for edit mode
- Form fields with validation
- Cancel and Save buttons
- Form submission handler

## 4. Add Client-Side JavaScript
Must include these functions:
- `showToast(msg, type)` - Show notifications
- `loadItems()` - Fetch data from API
- `renderItems()` - Render data to DOM
- `showAddModal()` - Show modal for adding
- `editItem(id)` - Load and show edit modal
- `saveItem()` - Save create/update
- `deleteItem(id, name)` - Delete with confirmation

Standard API pattern:
```javascript
const API = '/api/[resource]';
let allItems = [];

async function loadItems() {
    const res = await fetch(API, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
        allItems = data.data.items;
        renderItems();
    }
}
```

## 5. Register Admin Route
File: `routes/admin.js`

Add:
```javascript
router.get('/[feature]', webAuthenticate, webAdminOnly, (req, res) => {
  res.render('admin/views/[feature]/index', {
    title: '[Feature] Management - UGO Admin',
    user: req.user,
    currentPath: '/[feature]'
  });
});
```

## 6. Add to Sidebar Menu
File: `views/admin/components/sidebar.ejs`

Find appropriate section and add:
```html
<li class="nav-item">
    <a class="nav-link <%= isActive('/[feature]') ? 'active' : '' %>" href="/admin/[feature]">
        <i class="fas fa-[icon]"></i> [Feature Name]
    </a>
</li>
```

## 7. Test the View
1. Start server: `node app.js`
2. Login to admin panel
3. Navigate to new menu item
4. Test all CRUD operations
5. Test search and filters
6. Test error handling

## Checklist
- [ ] View folder structure created
- [ ] Main index.ejs created
- [ ] Edit modal created
- [ ] Client-side JavaScript includes all standard functions
- [ ] API endpoint constant defined
- [ ] Toast notifications working
- [ ] CRUD operations working
- [ ] Admin route registered
- [ ] Sidebar menu item added
- [ ] View tested in browser

## Standard Functions Required
```javascript
// Toast notifications
function showToast(msg, type = 'success') { }

// Data loading
async function loadItems() { }

// Rendering
function renderItems() { }

// CRUD operations
function showAddModal() { }
async function editItem(id) { }
async function saveItem() { }
async function deleteItem(id, name) { }
```

## Style Guidelines
- Use Bootstrap 5.3 classes
- Font Awesome 6.4 icons
- Consistent spacing and colors
- Responsive design
- Loading states
- Empty states
- Error states

## Reference
See existing views:
- `views/admin/views/schools/` - Complete example with maps
- `views/admin/views/integrations/` - Complex view with modals
- `views/admin/views/users/` - User management view
