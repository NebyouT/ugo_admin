const ApiEndpoint = require('../models/ApiEndpoint');
const ApiComment = require('../models/ApiComment');

class ApiDocsController {
  // Get all API endpoints grouped by category
  static async getEndpoints(req, res) {
    try {
      const { category, search } = req.query;
      
      const query = { isActive: true };
      if (category) query.category = category;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { endpoint: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const endpoints = await ApiEndpoint.find(query)
        .sort({ category: 1, order: 1 })
        .lean();

      // Group by category
      const grouped = endpoints.reduce((acc, endpoint) => {
        if (!acc[endpoint.category]) {
          acc[endpoint.category] = [];
        }
        acc[endpoint.category].push(endpoint);
        return acc;
      }, {});

      res.json({
        success: true,
        data: { endpoints, grouped }
      });
    } catch (error) {
      console.error('Get endpoints error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch endpoints'
      });
    }
  }

  // Get single endpoint with comments
  static async getEndpoint(req, res) {
    try {
      const { id } = req.params;
      
      const endpoint = await ApiEndpoint.findById(id).lean();
      if (!endpoint) {
        return res.status(404).json({
          success: false,
          message: 'Endpoint not found'
        });
      }

      const comments = await ApiComment.find({ apiEndpoint: id })
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: { endpoint, comments }
      });
    } catch (error) {
      console.error('Get endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch endpoint'
      });
    }
  }

  // Create new API endpoint
  static async createEndpoint(req, res) {
    try {
      const endpoint = new ApiEndpoint(req.body);
      await endpoint.save();

      res.status(201).json({
        success: true,
        message: 'API endpoint created successfully',
        data: { endpoint }
      });
    } catch (error) {
      console.error('Create endpoint error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create endpoint'
      });
    }
  }

  // Update API endpoint
  static async updateEndpoint(req, res) {
    try {
      const { id } = req.params;
      
      const endpoint = await ApiEndpoint.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!endpoint) {
        return res.status(404).json({
          success: false,
          message: 'Endpoint not found'
        });
      }

      res.json({
        success: true,
        message: 'API endpoint updated successfully',
        data: { endpoint }
      });
    } catch (error) {
      console.error('Update endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update endpoint'
      });
    }
  }

  // Delete API endpoint
  static async deleteEndpoint(req, res) {
    try {
      const { id } = req.params;
      
      await ApiEndpoint.findByIdAndUpdate(id, { isActive: false });

      res.json({
        success: true,
        message: 'API endpoint deleted successfully'
      });
    } catch (error) {
      console.error('Delete endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete endpoint'
      });
    }
  }

  // Get comments for an endpoint
  static async getComments(req, res) {
    try {
      const { endpointId } = req.params;
      
      const comments = await ApiComment.find({ apiEndpoint: endpointId })
        .populate('author', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: { comments }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comments'
      });
    }
  }

  // Add comment to endpoint
  static async addComment(req, res) {
    try {
      const { endpointId } = req.params;
      const { comment, issueType } = req.body;

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Comment is required'
        });
      }

      const newComment = new ApiComment({
        apiEndpoint: endpointId,
        author: req.user._id,
        authorName: `${req.user.firstName} ${req.user.lastName}`,
        comment: comment.trim(),
        issueType: issueType || 'note'
      });

      await newComment.save();

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment: newComment }
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  }

  // Mark comment as read
  static async markCommentRead(req, res) {
    try {
      const { commentId } = req.params;
      
      const comment = await ApiComment.findByIdAndUpdate(
        commentId,
        { isRead: true },
        { new: true }
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.json({
        success: true,
        message: 'Comment marked as read',
        data: { comment }
      });
    } catch (error) {
      console.error('Mark comment read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark comment as read'
      });
    }
  }

  // Resolve comment
  static async resolveComment(req, res) {
    try {
      const { commentId } = req.params;
      
      const comment = await ApiComment.findByIdAndUpdate(
        commentId,
        { 
          status: 'resolved',
          resolvedBy: req.user._id,
          resolvedAt: new Date(),
          isRead: true
        },
        { new: true }
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.json({
        success: true,
        message: 'Comment resolved successfully',
        data: { comment }
      });
    } catch (error) {
      console.error('Resolve comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve comment'
      });
    }
  }

  // Get unread comments count
  static async getUnreadCount(req, res) {
    try {
      const count = await ApiComment.countDocuments({ isRead: false });
      
      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count'
      });
    }
  }
}

module.exports = ApiDocsController;
