const express = require('express');
const router = express.Router();
const ChildrenController = require('../controllers/ChildrenController');
const { authenticate } = require('../../auth/middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/children:
 *   get:
 *     summary: Get all children for authenticated parent
 *     tags: [Children]
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
 *     responses:
 *       200:
 *         description: List of children
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
router.get('/', ChildrenController.getAll);

/**
 * @swagger
 * /api/children/{id}:
 *   get:
 *     summary: Get single child details
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Child details
 *       404:
 *         description: Child not found
 */
router.get('/:id', ChildrenController.getById);

/**
 * @swagger
 * /api/children:
 *   post:
 *     summary: Create new child
 *     tags: [Children]
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
 *               - grade
 *               - pickupAddress
 *               - schedules
 *             properties:
 *               name:
 *                 type: string
 *                 description: Child's full name
 *               grade:
 *                 type: string
 *                 description: Child's grade
 *               pickupAddress:
 *                 type: object
 *                 required:
 *                   - address
 *                   - coordinates
 *                 properties:
 *                   address:
 *                     type: string
 *                     description: Pickup address
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude]
 *                   landmark:
 *                     type: string
 *                     description: Nearby landmark
 *               schedules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - time
 *                     - day
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [pickup, dropoff]
 *                     time:
 *                       type: string
 *                       pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *                       description: Time in HH:mm format
 *                     day:
 *                       type: string
 *                       enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                     isActive:
 *                       type: boolean
 *                       default: true
 *                     notes:
 *                       type: string
 *               school:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   phone:
 *                     type: string
 *     responses:
 *       201:
 *         description: Child created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', ChildrenController.create);

/**
 * @swagger
 * /api/children/{id}:
 *   put:
 *     summary: Update child details
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               grade:
 *                 type: string
 *               pickupAddress:
 *                 type: object
 *               schedules:
 *                 type: array
 *               school:
 *                 type: object
 *     responses:
 *       200:
 *         description: Child updated successfully
 *       404:
 *         description: Child not found
 */
router.put('/:id', ChildrenController.update);

/**
 * @swagger
 * /api/children/{id}:
 *   delete:
 *     summary: Soft delete child
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Child deleted successfully
 *       404:
 *         description: Child not found
 */
router.delete('/:id', ChildrenController.delete);

/**
 * @swagger
 * /api/children/{id}/schedules:
 *   get:
 *     summary: Get child's schedules
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         description: Filter by specific day
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *       404:
 *         description: Child not found
 */
router.get('/:id/schedules', ChildrenController.getSchedules);

/**
 * @swagger
 * /api/children/{id}/today:
 *   get:
 *     summary: Get child's schedules for today
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Today's schedules retrieved successfully
 *       404:
 *         description: Child not found
 */
router.get('/:id/today', ChildrenController.getTodaySchedules);

/**
 * @swagger
 * /api/children/{id}/schedules:
 *   post:
 *     summary: Add schedule to child
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - time
 *               - day
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pickup, dropoff]
 *               time:
 *                 type: string
 *                 pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
 *               day:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Schedule added successfully
 *       404:
 *         description: Child not found
 */
router.post('/:id/schedules', ChildrenController.addSchedule);

/**
 * @swagger
 * /api/children/nearby:
 *   get:
 *     summary: Find children near a location (for drivers)
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Search radius in meters
 *     responses:
 *       200:
 *         description: Nearby children retrieved successfully
 */
router.get('/nearby', ChildrenController.getNearbyChildren);

module.exports = router;
