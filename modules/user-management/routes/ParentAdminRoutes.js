const express = require('express');
const router = express.Router();
const ParentAdminController = require('../controllers/ParentAdminController');
const { webAuthenticate, webAdminOnly } = require('../../auth/middleware/webAuth');

// All routes require authentication and admin role
router.use(webAuthenticate);
router.use(webAdminOnly);

/**
 * @swagger
 * /api/admin/parents:
 *   get:
 *     summary: Get all parents with children
 *     tags: [Admin Parents]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Parents retrieved successfully
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
 *                     parents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Parent'
 *                     pagination:
 *                       $ref: '#components/schemas/Pagination'
 */
router.get('/', ParentAdminController.getAll);

/**
 * @swagger
 * /api/admin/parents/{id}:
 *   get:
 *     summary: Get specific parent details
 *     tags: [Admin Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent ID
 *     responses:
 *       200:
 *         description: Parent details retrieved successfully
 *       404:
 *         description: Parent not found
 */
router.get('/:id', ParentAdminController.getById);

/**
 * @swagger
 * /api/admin/parents:
 *   post:
 *     summary: Create new parent
 *     tags: [Admin Parents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Parent's first name
 *               lastName:
 *                 type: string
 *                 description: Parent's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Parent's email address
 *               phone:
 *                 type: string
 *                 description: Parent's phone number
 *               password:
 *                 type: string
 *                 description: Parent's password
 *               parentInfo:
 *                 type: object
 *                 properties:
 *                   occupation:
 *                     type: string
 *                   company:
 *                     type: string
 *                   workAddress:
 *                     type: string
 *                   emergencyContacts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         relationship:
 *                           type: string
 *                         isPrimary:
 *                           type: boolean
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Parent created successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/', ParentAdminController.create);

/**
 * @swagger
 * /api/admin/parents/{id}:
 *   put:
 *     summary: Update parent
 *     tags: [Admin Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent ID
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
 *               parentInfo:
 *                 type: object
 *               address:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Parent updated successfully
 *       404:
 *         description: Parent not found
 */
router.put('/:id', ParentAdminController.update);

/**
 * @swagger
 * /api/admin/parents/{id}:
 *   delete:
 *     summary: Delete parent
 *     tags: [Admin Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent ID
 *     responses:
 *       200:
 *         description: Parent deleted successfully
 *       404:
 *         description: Parent not found
 *       400:
 *         description: Parent has active children
 */
router.delete('/:id', ParentAdminController.delete);

/**
 * @swagger
 * /api/admin/parents/stats:
 *   get:
 *     summary: Get parent statistics
 *     tags: [Admin Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent statistics retrieved successfully
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
 *                     totalParents:
 *                       type: integer
 *                     activeParents:
 *                       type: integer
 *                     inactiveParents:
 *                       type: integer
 *                     totalChildren:
 *                       type: integer
 *                     activeSubscriptions:
 *                       type: integer
 *                     avgChildrenPerParent:
 *                       type: number
 */
router.get('/stats', ParentAdminController.getStats);

module.exports = router;
