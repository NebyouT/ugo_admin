const express = require('express');
const router = express.Router();
const SchoolController = require('../controllers/SchoolController');
const { authenticate } = require('../../auth/middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Schools
 *   description: School management with Google Maps integration
 */

/**
 * @swagger
 * /api/schools:
 *   get:
 *     summary: Get all schools
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [kindergarten, primary, secondary, high_school, university, other]
 *         description: Filter by school type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by school name
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of schools
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
 *                     schools:
 *                       type: array
 *                     total:
 *                       type: integer
 */
router.get('/', authenticate, SchoolController.getAll);

/**
 * @swagger
 * /api/schools/nearby:
 *   get:
 *     summary: Find schools near a location
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of the location
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of the location
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: Nearby schools
 */
router.get('/nearby', authenticate, SchoolController.findNearby);

/**
 * @swagger
 * /api/schools/places/nearby:
 *   get:
 *     summary: Search nearby places using Google Places API
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of the location
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of the location
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 5000
 *         description: Search radius in meters
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *           default: school
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Nearby places found
 */
router.get('/places/nearby', authenticate, SchoolController.searchNearbyPlaces);

/**
 * @swagger
 * /api/schools/stats:
 *   get:
 *     summary: Get school statistics
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: School statistics
 */
router.get('/stats', authenticate, SchoolController.getStats);

/**
 * @swagger
 * /api/schools/{id}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: School ID
 *     responses:
 *       200:
 *         description: School details
 *       404:
 *         description: School not found
 */
router.get('/:id', authenticate, SchoolController.getOne);

/**
 * @swagger
 * /api/schools:
 *   post:
 *     summary: Create a new school
 *     tags: [Schools]
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
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Addis Ababa International School"
 *               latitude:
 *                 type: number
 *                 example: 9.0192
 *               longitude:
 *                 type: number
 *                 example: 38.7525
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                     example: "Addis Ababa"
 *                   region:
 *                     type: string
 *                   country:
 *                     type: string
 *                     default: "Ethiopia"
 *                   formattedAddress:
 *                     type: string
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   website:
 *                     type: string
 *               type:
 *                 type: string
 *                 enum: [kindergarten, primary, secondary, high_school, university, other]
 *               grades:
 *                 type: object
 *                 properties:
 *                   from:
 *                     type: string
 *                   to:
 *                     type: string
 *               studentCapacity:
 *                 type: integer
 *               serviceRadius:
 *                 type: number
 *                 description: Service radius in kilometers
 *               description:
 *                 type: string
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: School created successfully
 *       400:
 *         description: Validation error or duplicate school
 */
router.post('/', authenticate, SchoolController.create);

/**
 * @swagger
 * /api/schools/{id}:
 *   put:
 *     summary: Update school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: School updated successfully
 *       404:
 *         description: School not found
 */
router.put('/:id', authenticate, SchoolController.update);

/**
 * @swagger
 * /api/schools/{id}/status:
 *   patch:
 *     summary: Toggle school active status
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/:id/status', authenticate, SchoolController.toggleStatus);

/**
 * @swagger
 * /api/schools/{id}:
 *   delete:
 *     summary: Delete school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School deleted successfully
 *       404:
 *         description: School not found
 */
router.delete('/:id', authenticate, SchoolController.delete);

module.exports = router;
