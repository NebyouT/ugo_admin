const express = require('express');
const router = express.Router();
const GroupsController = require('../controllers/GroupsController');
const { authenticate } = require('../../auth/middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Ride-sharing group management endpoints
 */

/**
 * @swagger
 * /groups/search:
 *   post:
 *     summary: Search groups by school & location
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - school_id
 *             properties:
 *               school_id:
 *                 type: string
 *                 description: School ID
 *               pickup_location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               preferred_time:
 *                 type: string
 *                 pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                 description: Preferred pickup time (HH:MM)
 *     responses:
 *       200:
 *         description: Groups found successfully
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
 *                     groups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Group'
 *                     total:
 *                       type: integer
 *                     suggestion:
 *                       type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/search', authenticate, GroupsController.searchGroups);

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - school
 *               - schedule
 *               - capacity
 *               - base_price
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Morning Group A"
 *               school:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               schedule:
 *                 type: object
 *                 properties:
 *                   pickup_time:
 *                     type: string
 *                     pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                     example: "07:00"
 *                   drop_time:
 *                     type: string
 *                     pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                     example: "16:30"
 *                   days:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                     default: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 15
 *                 example: 8
 *               base_price:
 *                 type: number
 *                 minimum: 0
 *                 example: 2500
 *               service_radius:
 *                 type: number
 *                 example: 5
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 */
router.post('/', authenticate, GroupsController.create);

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all available groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: string
 *         description: Filter by school ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, full, inactive, cancelled]
 *         description: Filter by status
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
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
 *                     groups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Group'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, GroupsController.getAllGroups);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get group detail
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group detail retrieved successfully
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
 *                     group:
 *                       $ref: '#/components/schemas/GroupDetail'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, GroupsController.getGroupDetail);

/**
 * @swagger
 * /groups/{id}/driver:
 *   get:
 *     summary: Get group driver info
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Driver info retrieved successfully
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
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: No driver assigned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/driver', authenticate, GroupsController.getGroupDriver);

/**
 * @swagger
 * /groups/{id}/availability:
 *   get:
 *     summary: Check spots available
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Availability checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Availability'
 */
router.get('/:id/availability', authenticate, GroupsController.checkAvailability);

/**
 * @swagger
 * /groups/{id}/schedule:
 *   get:
 *     summary: Get pickup/drop schedule
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Schedule'
 */
router.get('/:id/schedule', authenticate, GroupsController.getGroupSchedule);

/**
 * @swagger
 * /groups/{id}/price-estimate:
 *   get:
 *     summary: Get price for my location
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Pickup address
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *     responses:
 *       200:
 *         description: Price estimate calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PriceEstimate'
 *       400:
 *         description: Location too far or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/price-estimate', authenticate, GroupsController.getPriceEstimate);

/**
 * @swagger
 * /groups/{id}:
 *   put:
 *     summary: Update group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               schedule:
 *                 type: object
 *               capacity:
 *                 type: integer
 *               base_price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [open, full, inactive, cancelled]
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     group:
 *                       $ref: '#/components/schemas/GroupDetail'
 */
router.put('/:id', authenticate, GroupsController.update);

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, GroupsController.delete);

module.exports = router;
