const express = require('express');
const router = express.Router();
const ZoneController = require('../controllers/ZoneController');
const { authenticate } = require('../../auth/middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Zones
 *   description: Zone management for geospatial service areas and fare calculation
 */

/**
 * @swagger
 * /zones:
 *   get:
 *     summary: Get all zones
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search zones by name or description
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of zones
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
 *                     zones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Zone'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, ZoneController.getAll);

/**
 * @swagger
 * /zones/search/location:
 *   get:
 *     summary: Search zones by location
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *           example: 9.0192
 *         description: Latitude of the center point
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *           example: 38.7525
 *         description: Longitude of the center point
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 10000
 *         description: Search radius in meters
 *     responses:
 *       200:
 *         description: Zones found by location
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
 *                     zones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Zone'
 *                     center:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                         radius:
 *                           type: number
 *                     total:
 *                       type: integer
 */
router.get('/search/location', authenticate, ZoneController.searchByLocation);

/**
 * @swagger
 * /zones/check-point:
 *   get:
 *     summary: Check if a point is within any zone
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *           example: 9.0192
 *         description: Latitude of the point to check
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *           example: 38.7525
 *         description: Longitude of the point to check
 *       - in: query
 *         name: zoneId
 *         schema:
 *           type: string
 *         description: Specific zone ID to check (optional)
 *     responses:
 *       200:
 *         description: Point zone check results
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
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           zoneId:
 *                             type: string
 *                           zoneName:
 *                             type: string
 *                           isWithin:
 *                             type: boolean
 *                           zoneColor:
 *                             type: string
 *                     total:
 *                       type: integer
 *                     point:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 */
router.get('/check-point', authenticate, ZoneController.checkPointInZone);

/**
 * @swagger
 * /zones/stats:
 *   get:
 *     summary: Get zone statistics
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Zone statistics
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
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     inactive:
 *                       type: integer
 *                     deleted:
 *                       type: integer
 */
router.get('/stats', authenticate, ZoneController.getStats);

/**
 * @swagger
 * /zones/{id}:
 *   get:
 *     summary: Get zone details
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     responses:
 *       200:
 *         description: Zone details
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
 *                     zone:
 *                       $ref: '#/components/schemas/Zone'
 *       404:
 *         description: Zone not found
 *         content:
 *           $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, ZoneController.getOne);

/**
 * @swagger
 * /zones:
 *   post:
 *     summary: Create a new zone
 *     tags: [Zones]
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
 *               - coordinates
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Bole Commercial Area"
 *               coordinates:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Polygon]
 *                     default: Polygon
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: array
 *                       items:
 *                         type: array
 *                         items:
 *                           type: number
 *                       minItems: 3
 *                     example: [[38.7525, 9.0192], [38.7535, 9.0198], [38.7545, 9.0202], [38.7525, 9.0192]]
 *               description:
 *                 type: string
 *                 example: "Commercial zone for Bole area"
 *               service_radius:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 50
 *                 default: 5
 *                 example: 5
 *               extra_fare_status:
 *                 type: boolean
 *                 default: false
 *               extra_fare_fee:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 50
 *               extra_fare_reason:
 *                 type: string
 *                 example: "High traffic area"
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 default: '#667eea'
 *                 example: '#667eea'
 *     responses:
 *       201:
 *         description: Zone created successfully
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
 *                     zone:
 *                       $ref: ' #/components/schemas/Zone'
 */
router.post('/', authenticate, ZoneController.create);

/**
 * @swagger
 * /zones/{id}:
 *   put:
 *     summary: Update zone
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Zone Name"
 *               description:
 *                 type: string
 *                 example: "Updated zone description"
 *               service_radius:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 50
 *                 example: 8
 *               extra_fare_status:
 *                 type: boolean
 *               extra_fare_fee:
 *                 type: number
 *                 minimum: 0
 *                 example: 75
 *               extra_fare_reason:
 *                 type: string
 *                 example: "Updated reason"
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#ff6b6b'
 *     responses:
 *       200:
 *         description: Zone updated successfully
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
 *                     zone:
 *                       $ref: '#/components/schemas/Zone'
 *       404:
 *         description: Zone not found
 *         content:
 *           $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, ZoneController.update);

/**
 * @swagger
 * /zones/{id}:
 *   patch:
 *     summary: Toggle zone active status
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Zone status updated successfully
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
 *                     zone:
 *                       $ref: '#/components/schemas/Zone'
 */
router.patch('/:id/status', authenticate, ZoneController.toggleStatus);

/**
 * @swagger
 * /zones/{id}:
 *   delete:
 *     summary: Delete zone (soft delete)
 *     tags: [Zones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Zone ID
 *     responses:
 *       200:
 *         description: Zone deleted successfully
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
 *         description: Zone not found
 *         content:
 *           $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, ZoneController.delete);

module.exports = router;
