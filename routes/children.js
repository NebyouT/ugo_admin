const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createChild,
  getChildren,
  getChild,
  updateChild,
  deleteChild,
  getChildStats,
  getChildrenByParent,
  getChildrenBySchool
} = require('../controllers/admin/childController');

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// ===== API ROUTES (must come before parameterized routes) =====

// @desc    Create new child
// @route   POST /admin/children/api
router.post('/api', createChild);

// @desc    Get all children with pagination and filtering
// @route   GET /admin/children/api
router.get('/api', getChildren);

// @desc    Get child statistics
// @route   GET /admin/children/api/stats
router.get('/api/stats', getChildStats);

// @desc    Get children by parent
// @route   GET /admin/children/api/parent/:parentId
router.get('/api/parent/:parentId', getChildrenByParent);

// @desc    Get children by school
// @route   GET /admin/children/api/school/:schoolId
router.get('/api/school/:schoolId', getChildrenBySchool);

// @desc    Get single child
// @route   GET /admin/children/api/:id
router.get('/api/:id', getChild);

// @desc    Update child
// @route   PUT /admin/children/api/:id
router.put('/api/:id', updateChild);

// @desc    Delete child (soft delete)
// @route   DELETE /admin/children/api/:id
router.delete('/api/:id', deleteChild);

// ===== VIEW ROUTES =====

// @desc    Children management page
// @route   GET /admin/children
router.get('/', (req, res) => {
  res.render('admin/children/index', { 
    title: 'Children - UGO Admin', 
    user: req.user 
  });
});

// @desc    Add child page
// @route   GET /admin/children/add
router.get('/add', (req, res) => {
  res.render('admin/children/add', { 
    title: 'Add Child - UGO Admin', 
    user: req.user 
  });
});

// @desc    Child details page
// @route   GET /admin/children/:id
router.get('/:id', (req, res) => {
  res.render('admin/children/details', { 
    title: 'Child Details - UGO Admin', 
    user: req.user,
    childId: req.params.id
  });
});

// @desc    Edit child page
// @route   GET /admin/children/:id/edit
router.get('/:id/edit', (req, res) => {
  res.render('admin/children/edit', { 
    title: 'Edit Child - UGO Admin', 
    user: req.user,
    childId: req.params.id
  });
});

module.exports = router;
