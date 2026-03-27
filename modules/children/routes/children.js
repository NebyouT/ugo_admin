const express = require("express");
const router = express.Router();
const ChildrenController = require("../controllers/ChildrenController");
const { authenticate } = require("../../auth/middleware/auth");

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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of children
 */
router.get("/", ChildrenController.getAll);

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
router.get("/:id", ChildrenController.getById);

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
 *               - pickup_address
 *             properties:
 *               name:
 *                 type: string
 *               grade:
 *                 type: string
 *               pickup_address:
 *                 type: string
 *               school_name:
 *                 type: string
 *               school:
 *                 type: string
 *                 description: School ObjectId (optional)
 *               vehicle_type:
 *                 type: string
 *                 enum: [bajaj, minibus, bus, any]
 *                 default: any
 *               start_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Child created successfully
 *       400:
 *         description: Validation error
 */
router.post("/", ChildrenController.create);

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
 *               pickup_address:
 *                 type: string
 *               school_name:
 *                 type: string
 *               vehicle_type:
 *                 type: string
 *               start_date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Child updated successfully
 *       404:
 *         description: Child not found
 */
router.put("/:id", ChildrenController.update);

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
 *     responses:
 *       200:
 *         description: Child deleted successfully
 *       404:
 *         description: Child not found
 */
router.delete("/:id", ChildrenController.delete);

module.exports = router;
