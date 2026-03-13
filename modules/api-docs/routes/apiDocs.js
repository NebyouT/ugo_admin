const express = require('express');
const router = express.Router();
const ApiDocsController = require('../controllers/ApiDocsController');
const { authenticate, adminOnly } = require('../../auth/middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(adminOnly);

// API Endpoints Management
router.get('/endpoints', ApiDocsController.getEndpoints);
router.get('/endpoints/:id', ApiDocsController.getEndpoint);
router.post('/endpoints', ApiDocsController.createEndpoint);
router.put('/endpoints/:id', ApiDocsController.updateEndpoint);
router.delete('/endpoints/:id', ApiDocsController.deleteEndpoint);

// Comments Management
router.get('/endpoints/:endpointId/comments', ApiDocsController.getComments);
router.post('/endpoints/:endpointId/comments', ApiDocsController.addComment);
router.patch('/comments/:commentId/read', ApiDocsController.markCommentRead);
router.patch('/comments/:commentId/resolve', ApiDocsController.resolveComment);
router.get('/comments/unread-count', ApiDocsController.getUnreadCount);

module.exports = router;
