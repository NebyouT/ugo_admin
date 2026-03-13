const Child = require('../models/Child');

class ChildrenController {
  // GET /children - Get all children for authenticated parent
  static async getAll(req, res) {
    try {
      const children = await Child.find({ parent: req.user._id, isActive: true })
        .sort({ createdAt: -1 })
        .lean();

      const formatted = children.map(c => ({
        id: c._id,
        full_name: c.fullName,
        school: c.school && c.school.name ? c.school : null,
        grade: c.grade,
        pickup_location: c.pickupLocation && c.pickupLocation.address ? c.pickupLocation : null,
        subscription: c.subscription && c.subscription.status ? {
          id: c.subscription.id,
          status: c.subscription.status,
          group_name: c.subscription.groupName,
          driver_name: c.subscription.driverName
        } : null,
        created_at: c.createdAt
      }));

      res.json({
        success: true,
        data: { children: formatted, total: formatted.length }
      });
    } catch (error) {
      console.error('Get children error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch children' }
      });
    }
  }

  // GET /children/:id - Get single child
  static async getOne(req, res) {
    try {
      const child = await Child.findOne({
        _id: req.params.id,
        parent: req.user._id,
        isActive: true
      }).lean();

      if (!child) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHILD_NOT_FOUND', message: 'Child not found' }
        });
      }

      const formatted = {
        id: child._id,
        full_name: child.fullName,
        date_of_birth: child.dateOfBirth,
        gender: child.gender,
        school: child.school,
        grade: child.grade,
        photo: child.photo,
        pickup_location: child.pickupLocation,
        emergency_contact: child.emergencyContact,
        medical_notes: child.medicalNotes,
        subscription: child.subscription && child.subscription.status ? {
          id: child.subscription.id,
          status: child.subscription.status,
          group: child.subscription.group,
          driver: child.subscription.driver,
          schedule: child.subscription.schedule ? {
            pickup_time: child.subscription.schedule.pickupTime,
            drop_time: child.subscription.schedule.dropTime
          } : null,
          price: child.subscription.price,
          start_date: child.subscription.startDate,
          payment_due: child.subscription.paymentDue
        } : null,
        created_at: child.createdAt,
        updated_at: child.updatedAt
      };

      res.json({ success: true, data: { child: formatted } });
    } catch (error) {
      console.error('Get child error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to fetch child' }
      });
    }
  }

  // POST /children - Add new child
  static async create(req, res) {
    try {
      const { full_name, date_of_birth, gender, school_id, grade, pickup_location, emergency_contact, medical_notes, photo } = req.body;

      // Validation
      const errors = {};
      if (!full_name) errors.full_name = 'Full name is required';
      if (!pickup_location || !pickup_location.address) errors.pickup_location = 'Pickup location is required';

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            details: errors
          }
        });
      }

      const child = new Child({
        parent: req.user._id,
        fullName: full_name,
        dateOfBirth: date_of_birth || null,
        gender: gender || null,
        school: school_id ? { id: school_id, name: school_id } : null,
        grade: grade || null,
        photo: photo || null,
        pickupLocation: pickup_location ? {
          address: pickup_location.address,
          lat: pickup_location.lat || null,
          lng: pickup_location.lng || null
        } : null,
        emergencyContact: emergency_contact ? {
          name: emergency_contact.name,
          phone: emergency_contact.phone,
          relationship: emergency_contact.relationship
        } : null,
        medicalNotes: medical_notes || null
      });

      await child.save();

      res.status(201).json({
        success: true,
        message: 'Child added successfully',
        data: {
          child: {
            id: child._id,
            full_name: child.fullName,
            date_of_birth: child.dateOfBirth,
            gender: child.gender,
            school: child.school,
            grade: child.grade,
            photo: child.photo,
            pickup_location: child.pickupLocation,
            subscription: null,
            created_at: child.createdAt
          },
          next_step: 'search_group'
        }
      });
    } catch (error) {
      console.error('Create child error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: error.message || 'Failed to add child' }
      });
    }
  }

  // PUT /children/:id - Update child
  static async update(req, res) {
    try {
      const child = await Child.findOne({
        _id: req.params.id,
        parent: req.user._id,
        isActive: true
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHILD_NOT_FOUND', message: 'Child not found' }
        });
      }

      // Cannot change school if subscription is active
      if (req.body.school_id && child.subscription && child.subscription.status === 'active') {
        if (req.body.school_id !== child.school?.id) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'CANNOT_CHANGE_SCHOOL',
              message: 'Cannot change school while subscription is active. Cancel subscription first.'
            }
          });
        }
      }

      const { full_name, date_of_birth, gender, grade, pickup_location, emergency_contact, medical_notes, photo } = req.body;

      if (full_name) child.fullName = full_name;
      if (date_of_birth) child.dateOfBirth = date_of_birth;
      if (gender) child.gender = gender;
      if (grade) child.grade = grade;
      if (photo) child.photo = photo;
      if (medical_notes !== undefined) child.medicalNotes = medical_notes;

      if (pickup_location) {
        child.pickupLocation = {
          address: pickup_location.address || child.pickupLocation?.address,
          lat: pickup_location.lat || child.pickupLocation?.lat,
          lng: pickup_location.lng || child.pickupLocation?.lng
        };
      }

      if (emergency_contact) {
        child.emergencyContact = {
          name: emergency_contact.name || child.emergencyContact?.name,
          phone: emergency_contact.phone || child.emergencyContact?.phone,
          relationship: emergency_contact.relationship || child.emergencyContact?.relationship
        };
      }

      await child.save();

      res.json({
        success: true,
        message: 'Child updated successfully',
        data: {
          child: {
            id: child._id,
            full_name: child.fullName,
            date_of_birth: child.dateOfBirth,
            gender: child.gender,
            school: child.school,
            grade: child.grade,
            photo: child.photo,
            pickup_location: child.pickupLocation,
            emergency_contact: child.emergencyContact,
            updated_at: child.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Update child error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to update child' }
      });
    }
  }

  // DELETE /children/:id - Delete child
  static async delete(req, res) {
    try {
      const child = await Child.findOne({
        _id: req.params.id,
        parent: req.user._id,
        isActive: true
      });

      if (!child) {
        return res.status(404).json({
          success: false,
          error: { code: 'CHILD_NOT_FOUND', message: 'Child not found' }
        });
      }

      if (child.subscription && child.subscription.status === 'active') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'HAS_ACTIVE_SUBSCRIPTION',
            message: 'Cannot delete child with active subscription. Cancel subscription first.'
          }
        });
      }

      child.isActive = false;
      await child.save();

      res.json({
        success: true,
        message: 'Child removed successfully'
      });
    } catch (error) {
      console.error('Delete child error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Failed to delete child' }
      });
    }
  }
}

module.exports = ChildrenController;
