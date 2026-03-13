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
 *     responses:
 *       200:
 *         description: List of children
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
 *     responses:
 *       200:
 *         description: Child details
 *       404:
 *         description: Child not found
 */
router.get('/:id', ChildrenController.getOne);

/**
 * @swagger
 * /api/children:
 *   post:
 *     summary: Add a new child
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
 *               - full_name
 *               - pickup_location
 *             properties:
 *               full_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               school_id:
 *                 type: string
 *               grade:
 *                 type: string
 *               pickup_location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               emergency_contact:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   relationship:
 *                     type: string
 *               medical_notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Child added successfully
 *       400:
 *         description: Validation error
 */
router.post('/', ChildrenController.create);

/**
 * @swagger
 * /api/children/{id}:
 *   put:
 *     summary: Update child information
 *     tags: [Children]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               grade:
 *                 type: string
 *               pickup_location:
 *                 type: object
 *               emergency_contact:
 *                 type: object
 *     responses:
 *       200:
 *         description: Child updated
 *       404:
 *         description: Child not found
 */
router.put('/:id', ChildrenController.update);

/**
 * @swagger
 * /api/children/{id}:
 *   delete:
 *     summary: Delete a child
 *     tags: [Children]
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
 *         description: Child removed
 *       400:
 *         description: Has active subscription
 *       404:
 *         description: Child not found
 */
router.delete('/:id', ChildrenController.delete);

module.exports = router;
