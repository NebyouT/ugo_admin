const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const ParentChildController = require('../controllers/ParentChildController');
const AuthMiddleware = require('../../../core/middleware/auth');

// Authentication Routes
router.post('/register', 
  UserController.registerValidation,
  UserController.register
);

router.post('/login',
  AuthMiddleware.authRateLimit(),
  UserController.loginValidation,
  UserController.login
);

router.post('/logout',
  AuthMiddleware.authenticate,
  UserController.logout
);

router.post('/refresh-token',
  UserController.refreshToken
);

// Profile Management Routes
router.get('/profile',
  AuthMiddleware.authenticate,
  UserController.getProfile
);

router.put('/profile',
  AuthMiddleware.authenticate,
  UserController.updateProfileValidation,
  UserController.updateProfile
);

router.put('/change-password',
  AuthMiddleware.authenticate,
  UserController.changePasswordValidation,
  UserController.changePassword
);

// Parent-Child Relationship Routes
router.post('/add-child',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeCustomerType('parent'),
  ParentChildController.addChildValidation,
  ParentChildController.addChild
);

router.get('/children',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorizeCustomerType('parent'),
  ParentChildController.getChildren
);

router.get('/parents/:childId',
  AuthMiddleware.authenticate,
  ParentChildController.getParents
);

router.put('/relationship/:relationshipId',
  AuthMiddleware.authenticate,
  ParentChildController.updateRelationshipValidation,
  ParentChildController.updateRelationship
);

router.delete('/relationship/:relationshipId',
  AuthMiddleware.authenticate,
  ParentChildController.removeChild
);

router.post('/relationship/:relationshipId/pickup-person',
  AuthMiddleware.authenticate,
  ParentChildController.addPickupPersonValidation,
  ParentChildController.addPickupPerson
);

router.post('/relationship/:relationshipId/note',
  AuthMiddleware.authenticate,
  ParentChildController.addNoteValidation,
  ParentChildController.addNote
);

router.get('/relationship/:relationshipId/schedule',
  AuthMiddleware.authenticate,
  ParentChildController.getTodaySchedule
);

// Admin Routes
router.get('/statistics',
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize('admin'),
  ParentChildController.getStatistics
);

module.exports = router;
