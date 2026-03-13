const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/IntegrationController');
const { authenticate } = require('../../auth/middleware/auth');
const { webAuthenticate, webAdminOnly } = require('../../auth/middleware/webAuth');

/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: Third-party integration management
 */

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: Get all integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sms_gateway, map_api, payment_gateway, push_notification, email_config, storage, other]
 *         description: Filter by settings type
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of integrations
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
 *                     integrations:
 *                       type: array
 *                     total:
 *                       type: integer
 */
router.get('/', authenticate, IntegrationController.getAll);

/**
 * @swagger
 * /api/integrations/types:
 *   get:
 *     summary: Get available integration types/templates
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Integration types
 */
router.get('/types', authenticate, IntegrationController.getTypes);

/**
 * @swagger
 * /api/integrations/initialize:
 *   post:
 *     summary: Initialize default integrations
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Defaults initialized
 */
router.post('/initialize', authenticate, IntegrationController.initializeDefaults);

/**
 * @swagger
 * /api/integrations/{keyName}:
 *   get:
 *     summary: Get integration by key name
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyName
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration key name (e.g., google_maps, afro_sms)
 *     responses:
 *       200:
 *         description: Integration details
 *       404:
 *         description: Integration not found
 */
router.get('/:keyName', authenticate, IntegrationController.getOne);

/**
 * @swagger
 * /api/integrations/{keyName}:
 *   put:
 *     summary: Create or update integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyName
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
 *               - settingsType
 *             properties:
 *               settingsType:
 *                 type: string
 *                 enum: [sms_gateway, map_api, payment_gateway, push_notification, email_config, storage, other]
 *               value:
 *                 type: object
 *                 description: Simple key-value configuration
 *               liveValues:
 *                 type: object
 *                 description: Live mode configuration
 *               testValues:
 *                 type: object
 *                 description: Test mode configuration
 *               mode:
 *                 type: string
 *                 enum: [live, test]
 *               isActive:
 *                 type: boolean
 *               description:
 *                 type: string
 *               additionalData:
 *                 type: object
 *           examples:
 *             google_maps:
 *               value:
 *                 keyName: google_maps
 *                 settingsType: map_api
 *                 value:
 *                   api_key: "YOUR_GOOGLE_MAPS_API_KEY"
 *                   enable_places: true
 *                   enable_directions: true
 *                   enable_geocoding: true
 *                 isActive: true
 *             afro_sms:
 *               value:
 *                 keyName: afro_sms
 *                 settingsType: sms_gateway
 *                 value:
 *                   api_key: "YOUR_AFRO_SMS_API_KEY"
 *                   sender_id: "UGO"
 *                   api_url: "https://api.afrosms.com/send"
 *                 isActive: true
 *     responses:
 *       200:
 *         description: Integration saved
 */
router.put('/:keyName', authenticate, IntegrationController.upsert);

/**
 * @swagger
 * /api/integrations/{keyName}/status:
 *   patch:
 *     summary: Update integration status (activate/deactivate)
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyName
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
 *         description: Status updated
 */
router.patch('/:keyName/status', authenticate, IntegrationController.updateStatus);

/**
 * @swagger
 * /api/integrations/{keyName}/test:
 *   post:
 *     summary: Test integration connection
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test completed
 */
router.post('/:keyName/test', authenticate, IntegrationController.test);

/**
 * @swagger
 * /api/integrations/{keyName}:
 *   delete:
 *     summary: Delete integration
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Integration deleted
 */
router.delete('/:keyName', authenticate, IntegrationController.delete);

module.exports = router;
