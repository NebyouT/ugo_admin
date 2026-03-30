const express = require("express");
const router = express.Router();
const GroupsController = require("../controllers/GroupsController");
const { authenticate } = require("../../auth/middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Ride-sharing group management endpoints
 */

/**
 * @swagger
 * /api/groups/vehicle-types:
 *   get:
 *     summary: Get vehicle types with max capacities
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: Vehicle types retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 vehicle_types:
 *                   - type: bajaj
 *                     max_capacity: 3
 *                     label: Bajaj
 *                   - type: force
 *                     max_capacity: 5
 *                     label: Force
 *                   - type: electric
 *                     max_capacity: 4
 *                     label: Electric
 */
router.get("/vehicle-types", GroupsController.getVehicleTypes);

/**
 * @swagger
 * /api/groups/search:
 *   post:
 *     summary: Search groups by school and parent's pickup location
 *     description: Finds open groups going to the same school whose pickup area is within radius_meters of the parent's GPS location
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
 *               - latitude
 *               - longitude
 *             properties:
 *               school_id:
 *                 type: string
 *                 description: ID of the school children go to
 *                 example: "507f1f77bcf86cd799439011"
 *               latitude:
 *                 type: number
 *                 description: Parent's current latitude
 *                 example: 9.5940
 *               longitude:
 *                 type: number
 *                 description: Parent's current longitude
 *                 example: 41.8670
 *               radius_meters:
 *                 type: integer
 *                 description: Search radius in meters (default 500)
 *                 default: 500
 *                 example: 500
 *               vehicle_type:
 *                 type: string
 *                 enum: [bajaj, force, electric]
 *                 description: Optional filter by vehicle type
 *     responses:
 *       200:
 *         description: Groups found successfully
 *       400:
 *         description: Missing school_id or coordinates
 */
router.post("/search", authenticate, GroupsController.searchGroups);

/**
 * @swagger
 * /api/groups:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, full, inactive, cancelled]
 *       - in: query
 *         name: vehicle_type
 *         schema:
 *           type: string
 *           enum: [bajaj, force, electric]
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
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
 */
router.get("/", authenticate, GroupsController.getAllGroups);

/**
 * @swagger
 * /api/groups:
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
 *               - vehicle_type
 *               - base_price
 *               - pickup_latitude
 *               - pickup_longitude
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Morning Group A"
 *               school:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               vehicle_type:
 *                 type: string
 *                 enum: [bajaj, force, electric]
 *                 example: "bajaj"
 *               capacity:
 *                 type: integer
 *                 description: Optional - auto-set from vehicle type if not provided
 *                 example: 3
 *               base_price:
 *                 type: number
 *                 example: 500
 *               pickup_address:
 *                 type: string
 *                 example: "Kezira, Dire Dawa"
 *               pickup_latitude:
 *                 type: number
 *                 example: 9.5933
 *               pickup_longitude:
 *                 type: number
 *                 example: 41.8661
 *               pickup_radius:
 *                 type: integer
 *                 description: Radius in meters parents must be within to join (default 500)
 *                 example: 500
 *               description:
 *                 type: string
 *                 example: "Kezira area morning group"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Validation error
 */
router.post("/", authenticate, GroupsController.create);

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group detail with members list
 *     tags: [Groups]
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
 *         description: Group detail retrieved successfully
 *       404:
 *         description: Group not found
 */
router.get("/:id", authenticate, GroupsController.getGroupDetail);

/**
 * @swagger
 * /api/groups/{id}/join:
 *   post:
 *     summary: Parent joins their child to a group
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
 *             required:
 *               - child_id
 *             properties:
 *               child_id:
 *                 type: string
 *                 description: ID of the child to add to the group
 *                 example: "507f1f77bcf86cd799439022"
 *     responses:
 *       200:
 *         description: Successfully joined the group
 *       400:
 *         description: Group full or child already a member
 *       404:
 *         description: Group or child not found
 */
router.post("/:id/join", authenticate, GroupsController.joinGroup);

/**
 * @swagger
 * /api/groups/{id}/leave:
 *   post:
 *     summary: Parent removes their child from a group
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
 *             required:
 *               - child_id
 *             properties:
 *               child_id:
 *                 type: string
 *                 description: ID of the child to remove from the group
 *                 example: "507f1f77bcf86cd799439022"
 *     responses:
 *       200:
 *         description: Successfully left the group
 *       400:
 *         description: Child is not an active member
 *       404:
 *         description: Group or child not found
 */
router.post("/:id/leave", authenticate, GroupsController.leaveGroup);

/**
 * @swagger
 * /api/groups/{id}/driver:
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
 *     responses:
 *       200:
 *         description: Driver info retrieved successfully
 *       400:
 *         description: No driver assigned
 */
router.get("/:id/driver", authenticate, GroupsController.getGroupDriver);

/**
 * @swagger
 * /api/groups/{id}/availability:
 *   get:
 *     summary: Check spots available in a group
 *     tags: [Groups]
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
 *         description: Availability checked successfully
 */
router.get(
  "/:id/availability",
  authenticate,
  GroupsController.checkAvailability,
);

/**
 * @swagger
 * /api/groups/{id}/price-estimate:
 *   get:
 *     summary: Get price estimate for a location
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Price estimate calculated successfully
 *       400:
 *         description: Validation error
 */
router.get(
  "/:id/price-estimate",
  authenticate,
  GroupsController.getPriceEstimate,
);

/**
 * @swagger
 * /api/groups/{id}:
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               vehicle_type:
 *                 type: string
 *                 enum: [bajaj, force, electric]
 *               capacity:
 *                 type: integer
 *               base_price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [open, full, inactive, cancelled]
 *               description:
 *                 type: string
 *               pickup_address:
 *                 type: string
 *               pickup_latitude:
 *                 type: number
 *               pickup_longitude:
 *                 type: number
 *               pickup_radius:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       404:
 *         description: Group not found
 */
router.put("/:id", authenticate, GroupsController.update);

/**
 * @swagger
 * /api/groups/{id}:
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
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       404:
 *         description: Group not found
 */
router.delete("/:id", authenticate, GroupsController.delete);

module.exports = router;
