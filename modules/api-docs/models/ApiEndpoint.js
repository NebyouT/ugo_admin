const mongoose = require('mongoose');

const apiEndpointSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    uppercase: true
  },
  endpoint: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    default: 'General'
  },
  requiresAuth: {
    type: Boolean,
    default: false
  },
  requestBody: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  requestExample: {
    type: String,
    default: null
  },
  responseSuccess: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  responseError: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unreadCommentsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
apiEndpointSchema.index({ category: 1, order: 1 });
apiEndpointSchema.index({ endpoint: 1 });
apiEndpointSchema.index({ isActive: 1 });

module.exports = mongoose.model('ApiEndpoint', apiEndpointSchema);
