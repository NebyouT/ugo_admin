const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createParent,
  getParents,
  getParent,
  updateParent,
  deleteParent,
  getParentStats,
  addChildToParent,
  removeChildFromParent
} = require('../controllers/admin/parentController');

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// ===== API ROUTES (must come before parameterized routes) =====

// @desc    Create new parent
// @route   POST /admin/parents/api
router.post('/api', createParent);

// @desc    Get all parents with pagination and filtering
// @route   GET /admin/parents/api
router.get('/api', getParents);

// @desc    Get parent statistics
// @route   GET /admin/parents/api/stats
router.get('/api/stats', getParentStats);

// @desc    Get single parent
// @route   GET /admin/parents/api/:id
router.get('/api/:id', getParent);

// @desc    Update parent
// @route   PUT /admin/parents/api/:id
router.put('/api/:id', updateParent);

// @desc    Delete parent (soft delete)
// @route   DELETE /admin/parents/api/:id
router.delete('/api/:id', deleteParent);

// @desc    Add child to parent
// @route   POST /admin/parents/api/:id/children
router.post('/api/:id/children', addChildToParent);

// @desc    Remove child from parent
// @route   DELETE /admin/parents/api/:id/children/:childId
router.delete('/api/:id/children/:childId', removeChildFromParent);

// ===== VIEW ROUTES =====

// @desc    Parent management page
// @route   GET /admin/parents
router.get('/', (req, res) => {
  res.render('admin/parents/index', { 
    title: 'Parents - UGO Admin', 
    user: req.user 
  });
});

// @desc    Add parent page
// @route   GET /admin/parents/add
router.get('/add', (req, res) => {
  res.render('admin/parents/add', { 
    title: 'Add Parent - UGO Admin', 
    user: req.user 
  });
});

// @desc    Parent details page
// @route   GET /admin/parents/:id
router.get('/:id', (req, res) => {
  res.render('admin/parents/details', { 
    title: 'Parent Details - UGO Admin', 
    user: req.user,
    parentId: req.params.id
  });
});

// @desc    Edit parent page
// @route   GET /admin/parents/:id/edit
router.get('/:id/edit', (req, res) => {
  res.render('admin/parents/edit', { 
    title: 'Edit Parent - UGO Admin', 
    user: req.user,
    parentId: req.params.id
  });
});

module.exports = router;
