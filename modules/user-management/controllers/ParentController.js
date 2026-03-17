const User = require('../models/User');
const Child = require('../../children/models/Child');

class ParentController {
  // GET /api/parents/profile - Get parent profile with children
  static async getProfile(req, res) {
    try {
      const parent = await User.findOne({ 
        _id: req.user._id, 
        userType: 'customer',
        customerType: 'parent'
      }).select('-password');

      if (!parent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent profile not found'
          }
        });
      }

      // Get parent's children
      const children = await Child.find({ 
        parent: parent._id, 
        isActive: true 
      })
        .populate('subscription.driver', 'firstName lastName phone')
        .populate('subscription.group', 'name')
        .sort({ createdAt: -1 });

      const formattedChildren = children.map(child => ({
        id: child._id,
        name: child.name,
        grade: child.grade,
        pickupAddress: child.pickupAddress,
        schedules: child.formattedSchedules,
        school: child.school,
        subscription: child.subscription,
        createdAt: child.createdAt
      }));

      res.json({
        success: true,
        message: 'Parent profile retrieved successfully',
        data: {
          parent: {
            id: parent._id,
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            phone: parent.phone,
            profileImage: parent.profileImage,
            parentInfo: parent.parentInfo,
            address: parent.address,
            createdAt: parent.createdAt
          },
          children: formattedChildren,
          stats: {
            totalChildren: children.length,
            activeSubscriptions: children.filter(c => c.subscription?.status === 'active').length,
            totalSchedules: children.reduce((total, child) => total + (child.schedules?.length || 0), 0)
          }
        }
      });
    } catch (error) {
      console.error('Get parent profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENT_PROFILE_FAILED',
          message: 'Failed to retrieve parent profile',
          details: error.message
        }
      });
    }
  }

  // PUT /api/parents/profile - Update parent profile
  static async updateProfile(req, res) {
    try {
      const {
        firstName,
        lastName,
        phone,
        profileImage,
        address,
        parentInfo
      } = req.body;

      const parent = await User.findOne({ 
        _id: req.user._id, 
        userType: 'parent' 
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent profile not found'
          }
        });
      }

      // Update allowed fields
      if (firstName) parent.firstName = firstName.trim();
      if (lastName) parent.lastName = lastName.trim();
      if (phone) parent.phone = phone.trim();
      if (profileImage !== undefined) parent.profileImage = profileImage;
      if (address) parent.address = address;
      if (parentInfo) parent.parentInfo = { ...parent.parentInfo, ...parentInfo };

      await parent.save();

      res.json({
        success: true,
        message: 'Parent profile updated successfully',
        data: {
          parent: {
            id: parent._id,
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            phone: parent.phone,
            profileImage: parent.profileImage,
            parentInfo: parent.parentInfo,
            address: parent.address,
            updatedAt: parent.updatedAt
          }
        }
      });
    } catch (error) {
      console.error('Update parent profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_PARENT_PROFILE_FAILED',
          message: 'Failed to update parent profile',
          details: error.message
        }
      });
    }
  }

  // GET /api/parents/children - Get parent's children with detailed info
  static async getChildren(req, res) {
    try {
      const { page = 1, limit = 10, active = true, subscriptionStatus } = req.query;
      
      let query = { 
        parent: req.user._id, 
        isActive: active === 'true' 
      };

      // Filter by subscription status if provided
      if (subscriptionStatus) {
        query['subscription.status'] = subscriptionStatus;
      }

      const children = await Child.find(query)
        .populate('subscription.driver', 'firstName lastName phone vehicle')
        .populate('subscription.group', 'name description')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await Child.countDocuments(query);

      const formatted = children.map(child => ({
        id: child._id,
        name: child.name,
        grade: child.grade,
        pickupAddress: child.pickupAddress,
        schedules: child.formattedSchedules,
        school: child.school,
        subscription: child.subscription,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt
      }));

      res.json({
        success: true,
        message: 'Children retrieved successfully',
        data: {
          children: formatted,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get parent children error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENT_CHILDREN_FAILED',
          message: 'Failed to retrieve children',
          details: error.message
        }
      });
    }
  }

  // GET /api/parents/dashboard - Get parent dashboard data
  static async getDashboard(req, res) {
    try {
      const parent = await User.findOne({ 
        _id: req.user._id, 
        userType: 'parent' 
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent not found'
          }
        });
      }

      // Get children with their subscriptions
      const children = await Child.find({ 
        parent: parent._id, 
        isActive: true 
      })
        .populate('subscription.driver', 'firstName lastName phone')
        .populate('subscription.group', 'name')
        .lean();

      // Calculate dashboard statistics
      const stats = {
        totalChildren: children.length,
        activeSubscriptions: children.filter(c => c.subscription?.status === 'active').length,
        inactiveSubscriptions: children.filter(c => c.subscription?.status === 'inactive').length,
        pendingSubscriptions: children.filter(c => c.subscription?.status === 'pending').length,
        totalSchedules: children.reduce((total, child) => total + (child.schedules?.length || 0), 0),
        assignedDrivers: [...new Set(children
          .filter(c => c.subscription?.driver)
          .map(c => c.subscription.driver._id)
        )].length
      };

      // Get today's schedules for all children
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todaySchedules = [];
      
      children.forEach(child => {
        if (child.formattedSchedules && child.formattedSchedules[today]) {
          const daySchedules = child.formattedSchedules[today];
          Object.keys(daySchedules).forEach(type => {
            daySchedules[type].forEach(schedule => {
              todaySchedules.push({
                childName: child.name,
                childId: child._id,
                type: type,
                time: schedule.time,
                notes: schedule.notes,
                pickupAddress: child.pickupAddress,
                driver: child.subscription?.driver || null,
                school: child.school?.name || null
              });
            });
          });
        }
      });

      // Sort today's schedules by time
      todaySchedules.sort((a, b) => a.time.localeCompare(b.time));

      // Get upcoming pickups (next 24 hours)
      const upcomingPickups = todaySchedules
        .filter(s => s.type === 'pickup')
        .slice(0, 5);

      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          parent: {
            id: parent._id,
            firstName: parent.firstName,
            lastName: parent.lastName,
            profileImage: parent.profileImage
          },
          stats,
          todaySchedules,
          upcomingPickups,
          recentActivity: children.slice(0, 3).map(child => ({
            childName: child.name,
            lastUpdated: child.updatedAt,
            subscriptionStatus: child.subscription?.status || 'inactive'
          }))
        }
      });
    } catch (error) {
      console.error('Get parent dashboard error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENT_DASHBOARD_FAILED',
          message: 'Failed to retrieve dashboard data',
          details: error.message
        }
      });
    }
  }

  // GET /api/parents/calendar - Get parent's children schedules in calendar format
  static async getCalendar(req, res) {
    try {
      const { month, year } = req.query;
      const currentDate = new Date();
      const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();

      // Get all children for the parent
      const children = await Child.find({ 
        parent: req.user._id, 
        isActive: true 
      }).lean();

      // Generate calendar events for the month
      const events = [];
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(targetYear, targetMonth, day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        children.forEach(child => {
          if (child.formattedSchedules && child.formattedSchedules[dayName]) {
            const daySchedules = child.formattedSchedules[dayName];
            
            Object.keys(daySchedules).forEach(type => {
              daySchedules[type].forEach(schedule => {
                events.push({
                  id: `${child._id}-${dayName}-${type}`,
                  title: `${child.name} - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                  start: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${schedule.time}:00`,
                  childId: child._id,
                  childName: child.name,
                  type: type,
                  time: schedule.time,
                  notes: schedule.notes,
                  pickupAddress: child.pickupAddress,
                  school: child.school?.name || null,
                  color: type === 'pickup' ? '#1976d2' : '#7b1fa2'
                });
              });
            });
          }
        });
      }

      res.json({
        success: true,
        message: 'Calendar data retrieved successfully',
        data: {
          month: targetMonth + 1,
          year: targetYear,
          events,
          totalEvents: events.length
        }
      });
    } catch (error) {
      console.error('Get parent calendar error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENT_CALENDAR_FAILED',
          message: 'Failed to retrieve calendar data',
          details: error.message
        }
      });
    }
  }

  // GET /api/parents/notifications - Get parent notifications
  static async getNotifications(req, res) {
    try {
      const { limit = 10, unread = false } = req.query;
      
      // Get parent's children
      const children = await Child.find({ 
        parent: req.user._id, 
        isActive: true 
      }).lean();

      // Generate notifications based on children's schedules and subscriptions
      const notifications = [];
      const today = new Date();
      const todayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = today.toTimeString().slice(0, 5); // HH:mm format

      children.forEach(child => {
        // Check for upcoming schedules today
        if (child.formattedSchedules && child.formattedSchedules[todayName]) {
          const daySchedules = child.formattedSchedules[todayName];
          
          Object.keys(daySchedules).forEach(type => {
            daySchedules[type].forEach(schedule => {
              const scheduleTime = schedule.time;
              const timeDiff = (new Date(`1970-01-01T${scheduleTime}:00`).getTime() - 
                              new Date(`1970-01-01T${currentTime}:00`).getTime()) / (1000 * 60);
              
              // Create notification for schedules within next 30 minutes
              if (timeDiff > 0 && timeDiff <= 30) {
                notifications.push({
                  id: `upcoming-${child._id}-${type}`,
                  type: 'upcoming_pickup',
                  title: `Upcoming ${type} for ${child.name}`,
                  message: `${child.name} has a ${type} scheduled at ${scheduleTime}`,
                  time: new Date(),
                  read: false,
                  priority: 'high',
                  childId: child._id,
                  childName: child.name,
                  actionType: type,
                  actionTime: scheduleTime
                });
              }
            });
          });
        }

        // Check subscription status
        if (child.subscription?.status === 'pending') {
          notifications.push({
            id: `subscription-${child._id}`,
            type: 'subscription_pending',
            title: 'Subscription Pending',
            message: `Subscription for ${child.name} is pending approval`,
            time: child.subscription.createdAt || new Date(),
            read: false,
            priority: 'medium',
            childId: child._id,
            childName: child.name
          });
        }
      });

      // Sort notifications by time and priority
      notifications.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return b.time - a.time;
      });

      // Filter by unread status if requested
      const filteredNotifications = unread === 'true' 
        ? notifications.filter(n => !n.read)
        : notifications.slice(0, parseInt(limit));

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications: filteredNotifications,
          unreadCount: notifications.filter(n => !n.read).length,
          totalCount: notifications.length
        }
      });
    } catch (error) {
      console.error('Get parent notifications error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENT_NOTIFICATIONS_FAILED',
          message: 'Failed to retrieve notifications',
          details: error.message
        }
      });
    }
  }

  // POST /api/parents/notifications/:id/read - Mark notification as read
  static async markNotificationRead(req, res) {
    try {
      const { id } = req.params;
      
      // In a real implementation, you would store notifications in the database
      // For now, we'll just return success as this is handled client-side
      
      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MARK_NOTIFICATION_READ_FAILED',
          message: 'Failed to mark notification as read',
          details: error.message
        }
      });
    }
  }

  // GET /api/parents/settings - Get parent settings
  static async getSettings(req, res) {
    try {
      const parent = await User.findOne({ 
        _id: req.user._id, 
        userType: 'parent' 
      }).select('parentInfo notificationPreferences');

      if (!parent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent not found'
          }
        });
      }

      res.json({
        success: true,
        message: 'Parent settings retrieved successfully',
        data: {
          parentInfo: parent.parentInfo || {},
          notificationPreferences: parent.notificationPreferences || {
            email: true,
            sms: true,
            push: true,
            pickupReminders: true,
            dropoffReminders: true,
            subscriptionUpdates: true,
            driverUpdates: true
          }
        }
      });
    } catch (error) {
      console.error('Get parent settings error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PARENT_SETTINGS_FAILED',
          message: 'Failed to retrieve parent settings',
          details: error.message
        }
      });
    }
  }

  // PUT /api/parents/settings - Update parent settings
  static async updateSettings(req, res) {
    try {
      const { parentInfo, notificationPreferences } = req.body;

      const parent = await User.findOne({ 
        _id: req.user._id, 
        userType: 'parent' 
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PARENT_NOT_FOUND',
            message: 'Parent not found'
          }
        });
      }

      // Update parent info
      if (parentInfo) {
        parent.parentInfo = { ...parent.parentInfo, ...parentInfo };
      }

      // Update notification preferences
      if (notificationPreferences) {
        parent.notificationPreferences = { 
          ...(parent.notificationPreferences || {}), 
          ...notificationPreferences 
        };
      }

      await parent.save();

      res.json({
        success: true,
        message: 'Parent settings updated successfully',
        data: {
          parentInfo: parent.parentInfo,
          notificationPreferences: parent.notificationPreferences
        }
      });
    } catch (error) {
      console.error('Update parent settings error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_PARENT_SETTINGS_FAILED',
          message: 'Failed to update parent settings',
          details: error.message
        }
      });
    }
  }
}

module.exports = ParentController;
