const express = require('express');
const router = express.Router();
const ParentController = require('../controllers/ParentController');
const { authenticate } = require('../../auth/middleware/auth');

// All routes require authentication and parent role
router.use(authenticate);

// Middleware to ensure user is a parent
router.use((req, res, next) => {
  if (req.user.userType !== 'customer' || req.user.customerType !== 'parent') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'Access denied. Parent role required.'
      }
    });
  }
  next();
});

/**
 * @swagger
 * /api/parents/profile:
 *   get:
 *     summary: Get parent profile with children
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent profile with children information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     parent:
 *                       $ref: '#/components/schemas/Parent'
 *                     children:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Child'
 *                     stats:
 *                       $ref: '#/components/schemas/ParentStats'
 */
router.get('/profile', ParentController.getProfile);

/**
 * @swagger
 * /api/parents/profile:
 *   put:
 *     summary: Update parent profile
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               profileImage:
 *                 type: string
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *               parentInfo:
 *                 $ref: '#/components/schemas/ParentInfo'
 *     responses:
 *       200:
 *         description: Parent profile updated successfully
 *       404:
 *         description: Parent not found
 */
router.put('/profile', ParentController.updateProfile);

/**
 * @swagger
 * /api/parents/children:
 *   get:
 *     summary: Get parent's children with detailed information
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *       - in: query
 *         name: subscriptionStatus
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, suspended]
 *         description: Filter by subscription status
 *     responses:
 *       200:
 *         description: Children retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     children:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Child'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/children', ParentController.getChildren);

/**
 * @swagger
 * /api/parents/dashboard:
 *   get:
 *     summary: Get parent dashboard data
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     parent:
 *                       $ref: '#/components/schemas/Parent'
 *                     stats:
 *                       $ref: '#/components/schemas/ParentStats'
 *                     todaySchedules:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Schedule'
 *                     upcomingPickups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Schedule'
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Activity'
 */
router.get('/dashboard', ParentController.getDashboard);

/**
 * @swagger
 * /api/parents/calendar:
 *   get:
 *     summary: Get parent's children schedules in calendar format
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year
 *     responses:
 *       200:
 *         description: Calendar data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: integer
 *                     year:
 *                       type: integer
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CalendarEvent'
 *                     totalEvents:
 *                       type: integer
 */
router.get('/calendar', ParentController.getCalendar);

/**
 * @swagger
 * /api/parents/notifications:
 *   get:
 *     summary: Get parent notifications
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of notifications
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter unread notifications only
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     unreadCount:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 */
router.get('/notifications', ParentController.getNotifications);

/**
 * @swagger
 * /api/parents/notifications/{id}/read:
 *   post:
 *     summary: Mark notification as read
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.post('/notifications/:id/read', ParentController.markNotificationRead);

/**
 * @swagger
 * /api/parents/settings:
 *   get:
 *     summary: Get parent settings
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     parentInfo:
 *                       $ref: '#/components/schemas/ParentInfo'
 *                     notificationPreferences:
 *                       $ref: '#/components/schemas/NotificationPreferences'
 */
router.get('/settings', ParentController.getSettings);

/**
 * @swagger
 * /api/parents/settings:
 *   put:
 *     summary: Update parent settings
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentInfo:
 *                 $ref: '#/components/schemas/ParentInfo'
 *               notificationPreferences:
 *                 $ref: '#/components/schemas/NotificationPreferences'
 *     responses:
 *       200:
 *         description: Parent settings updated successfully
 */
router.put('/settings', ParentController.updateSettings);

module.exports = router;
