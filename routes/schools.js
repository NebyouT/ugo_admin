const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats,
  getNearbySchools,
  getSchoolsByCity
} = require('../controllers/admin/schoolController');

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('admin'));

// ===== API ROUTES (must come before parameterized routes) =====

// @desc    Create new school
// @route   POST /admin/schools/api
router.post('/api', createSchool);

// @desc    Get all schools with pagination and filtering
// @route   GET /admin/schools/api
router.get('/api', getSchools);

// @desc    Get school statistics
// @route   GET /admin/schools/api/stats
router.get('/api/stats', getSchoolStats);

// @desc    Get nearby schools
// @route   GET /admin/schools/api/nearby
router.get('/api/nearby', getNearbySchools);

// @desc    Get single school
// @route   GET /admin/schools/api/:id
router.get('/api/:id', getSchool);

// @desc    Update school
// @route   PUT /admin/schools/api/:id
router.put('/api/:id', updateSchool);

// @desc    Delete school (soft delete)
// @route   DELETE /admin/schools/api/:id
router.delete('/api/:id', deleteSchool);

// @desc    Get schools by city
// @route   GET /admin/schools/api/city/:city
router.get('/api/city/:city', getSchoolsByCity);

// ===== VIEW ROUTES =====

// @desc    School management page
// @route   GET /admin/schools
router.get('/', (req, res) => {
  res.render('admin/schools/index', { 
    title: 'Schools - UGO Admin', 
    user: req.user 
  });
});

// @desc    Add school page
// @route   GET /admin/schools/add
router.get('/add', (req, res) => {
  res.render('admin/schools/add', { 
    title: 'Add School - UGO Admin', 
    user: req.user 
  });
});

// @desc    School details page
// @route   GET /admin/schools/:id
router.get('/:id', (req, res) => {
  res.render('admin/schools/details', { 
    title: 'School Details - UGO Admin', 
    user: req.user,
    schoolId: req.params.id
  });
});

// @desc    Edit school page
// @route   GET /admin/schools/:id/edit
router.get('/:id/edit', (req, res) => {
  res.render('admin/schools/edit', { 
    title: 'Edit School - UGO Admin', 
    user: req.user,
    schoolId: req.params.id
  });
});

module.exports = router;
