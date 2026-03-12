const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ParentChildRelationship = require('../models/ParentChildRelationship');
const { UserAccount } = require('../models/UserRelated');
const AuthMiddleware = require('../../../core/middleware/auth');
const { formatResponse } = require('../../../core/utils/helpers');

class ParentChildController {
  /**
   * Add Child to Parent
   */
  static addChildValidation = [
    body('childEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid child email required'),
    
    body('relationshipType')
      .isIn(['parent', 'guardian', 'caregiver'])
      .withMessage('Relationship type must be parent, guardian, or caregiver'),
    
    body('custodyType')
      .isIn(['full', 'joint', 'temporary'])
      .withMessage('Custody type must be full, joint, or temporary')
  ];

  static async addChild(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          formatResponse(false, 'Validation failed', errors.array())
        );
      }

      const { childEmail, relationshipType, custodyType, ...relationshipData } = req.body;
      const parent = req.user;

      // Check if parent is authorized to add children
      if (parent.customerType !== 'parent' && parent.role !== 'admin') {
        return res.status(403).json(
          formatResponse(false, 'Only parents can add children')
        );
      }

      // Find child user
      const child = await User.findOne({ 
        email: childEmail.toLowerCase(),
        userType: 'customer',
        customerType: 'student'
      });

      if (!child) {
        return res.status(404).json(
          formatResponse(false, 'Student not found with this email')
        );
      }

      // Check if relationship already exists
      const existingRelationship = await ParentChildRelationship.findOne({
        parent: parent._id,
        child: child._id,
        isActive: true
      });

      if (existingRelationship) {
        return res.status(400).json(
          formatResponse(false, 'Parent-child relationship already exists')
        );
      }

      // Create relationship
      const relationship = new ParentChildRelationship({
        parent: parent._id,
        child: child._id,
        relationshipType,
        custodyType,
        ...relationshipData
      });

      await relationship.save();

      // Populate relationship data
      await relationship.populate([
        { path: 'parent', select: 'firstName lastName email phone' },
        { path: 'child', select: 'firstName lastName email phone studentInfo' }
      ]);

      res.status(201).json(
        formatResponse(true, 'Child added successfully', relationship)
      );
    } catch (error) {
      console.error('Add child error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to add child', error.message)
      );
    }
  }

  /**
   * Get Parent's Children
   */
  static async getChildren(req, res) {
    try {
      const parent = req.user;

      if (parent.customerType !== 'parent' && parent.role !== 'admin') {
        return res.status(403).json(
          formatResponse(false, 'Access denied')
        );
      }

      let relationships;
      if (parent.role === 'admin') {
        relationships = await ParentChildRelationship.findActiveRelationships();
      } else {
        relationships = await ParentChildRelationship.findByParent(parent._id);
      }

      res.json(
        formatResponse(true, 'Children retrieved successfully', relationships)
      );
    } catch (error) {
      console.error('Get children error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to retrieve children', error.message)
      );
    }
  }

  /**
   * Get Child's Parents
   */
  static async getParents(req, res) {
    try {
      const { childId } = req.params;
      const user = req.user;

      // Check authorization
      if (user.customerType === 'student' && user._id.toString() !== childId) {
        return res.status(403).json(
          formatResponse(false, 'Access denied')
        );
      }

      const relationships = await ParentChildRelationship.findByChild(childId);

      res.json(
        formatResponse(true, 'Parents retrieved successfully', relationships)
      );
    } catch (error) {
      console.error('Get parents error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to retrieve parents', error.message)
      );
    }
  }

  /**
   * Update Parent-Child Relationship
   */
  static updateRelationshipValidation = [
    body('relationshipType')
      .optional()
      .isIn(['parent', 'guardian', 'caregiver'])
      .withMessage('Relationship type must be parent, guardian, or caregiver'),
    
    body('custodyType')
      .optional()
      .isIn(['full', 'joint', 'temporary'])
      .withMessage('Custody type must be full, joint, or temporary')
  ];

  static async updateRelationship(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          formatResponse(false, 'Validation failed', errors.array())
        );
      }

      const { relationshipId } = req.params;
      const updates = req.body;

      // Find relationship
      const relationship = await ParentChildRelationship.findById(relationshipId);
      
      if (!relationship) {
        return res.status(404).json(
          formatResponse(false, 'Relationship not found')
        );
      }

      // Check authorization
      const user = req.user;
      if (user.role !== 'admin' && 
          relationship.parent.toString() !== user._id.toString()) {
        return res.status(403).json(
          formatResponse(false, 'Access denied')
        );
      }

      // Update relationship
      Object.assign(relationship, updates);
      await relationship.save();

      // Populate updated data
      await relationship.populate([
        { path: 'parent', select: 'firstName lastName email phone' },
        { path: 'child', select: 'firstName lastName email phone studentInfo' }
      ]);

      res.json(
        formatResponse(true, 'Relationship updated successfully', relationship)
      );
    } catch (error) {
      console.error('Update relationship error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to update relationship', error.message)
      );
    }
  }

  /**
   * Remove Child from Parent
   */
  static async removeChild(req, res) {
    try {
      const { relationshipId } = req.params;
      const user = req.user;

      // Find relationship
      const relationship = await ParentChildRelationship.findById(relationshipId);
      
      if (!relationship) {
        return res.status(404).json(
          formatResponse(false, 'Relationship not found')
        );
      }

      // Check authorization
      if (user.role !== 'admin' && 
          relationship.parent.toString() !== user._id.toString()) {
        return res.status(403).json(
          formatResponse(false, 'Access denied')
        );
      }

      // Soft delete relationship
      relationship.isActive = false;
      relationship.endDate = new Date();
      await relationship.save();

      res.json(
        formatResponse(true, 'Child removed successfully')
      );
    } catch (error) {
      console.error('Remove child error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to remove child', error.message)
      );
    }
  }

  /**
   * Add Pickup Person
   */
  static addPickupPersonValidation = [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Pickup person name required'),
    
    body('phone')
      .isMobilePhone()
      .withMessage('Valid phone number required'),
    
    body('relationship')
      .trim()
      .notEmpty()
      .withMessage('Relationship required')
  ];

  static async addPickupPerson(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          formatResponse(false, 'Validation failed', errors.array())
        );
      }

      const { relationshipId } = req.params;
      const pickupPersonData = req.body;

      // Find relationship
      const relationship = await ParentChildRelationship.findById(relationshipId);
      
      if (!relationship) {
        return res.status(404).json(
          formatResponse(false, 'Relationship not found')
        );
      }

      // Check authorization
      const user = req.user;
      if (user.role !== 'admin' && 
          relationship.parent.toString() !== user._id.toString()) {
        return res.status(403).json(
          formatResponse(false, 'Access denied')
        );
      }

      // Add pickup person
      await relationship.addPickupPerson(pickupPersonData);

      res.json(
        formatResponse(true, 'Pickup person added successfully')
      );
    } catch (error) {
      console.error('Add pickup person error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to add pickup person', error.message)
      );
    }
  }

  /**
   * Add Note to Relationship
   */
  static addNoteValidation = [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Note content required'),
    
    body('type')
      .optional()
      .isIn(['general', 'emergency', 'schedule_change', 'pickup_issue', 'behavioral'])
      .withMessage('Note type must be valid')
  ];

  static async addNote(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          formatResponse(false, 'Validation failed', errors.array())
        );
      }

      const { relationshipId } = req.params;
      const { content, type = 'general' } = req.body;
      const user = req.user;

      // Find relationship
      const relationship = await ParentChildRelationship.findById(relationshipId);
      
      if (!relationship) {
        return res.status(404).json(
          formatResponse(false, 'Relationship not found')
        );
      }

      // Check authorization
      if (user.role !== 'admin' && 
          relationship.parent.toString() !== user._id.toString()) {
        return res.status(403).json(
          formatResponse(false, 'Access denied')
        );
      }

      // Add note
      await relationship.addNote(content, user._id, type);

      res.json(
        formatResponse(true, 'Note added successfully')
      );
    } catch (error) {
      console.error('Add note error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to add note', error.message)
      );
    }
  }

  /**
   * Get Today's Schedule for Child
   */
  static async getTodaySchedule(req, res) {
    try {
      const { relationshipId } = req.params;
      const user = req.user;

      // Find relationship
      const relationship = await ParentChildRelationship.findById(relationshipId);
      
      if (!relationship) {
        return res.status(404).json(
          formatResponse(false, 'Relationship not found')
        );
      }

      // Check authorization
      if (user.role !== 'admin' && 
          relationship.parent.toString() !== user._id.toString() &&
          relationship.child.toString() !== user._id.toString()) {
        return res.status(403).json(
          formatResponse(false, 'Access denied')
        );
      }

      // Get today's schedule
      const todaySchedule = relationship.getTodaySchedule();

      res.json(
        formatResponse(true, 'Today\'s schedule retrieved successfully', todaySchedule)
      );
    } catch (error) {
      console.error('Get today schedule error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to retrieve today\'s schedule', error.message)
      );
    }
  }

  /**
   * Get Parent-Child Statistics
   */
  static async getStatistics(req, res) {
    try {
      const user = req.user;

      if (user.role !== 'admin') {
        return res.status(403).json(
          formatResponse(false, 'Access denied')
        );
      }

      const stats = await ParentChildRelationship.getRelationshipStats();

      res.json(
        formatResponse(true, 'Statistics retrieved successfully', stats)
      );
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json(
        formatResponse(false, 'Failed to retrieve statistics', error.message)
      );
    }
  }
}

module.exports = ParentChildController;
