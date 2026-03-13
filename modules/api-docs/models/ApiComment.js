const mongoose = require('mongoose');

const apiCommentSchema = new mongoose.Schema({
  apiEndpoint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiEndpoint',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  issueType: {
    type: String,
    enum: ['bug', 'question', 'suggestion', 'note', 'error'],
    default: 'note'
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'closed'],
    default: 'open'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
apiCommentSchema.index({ apiEndpoint: 1, createdAt: -1 });
apiCommentSchema.index({ author: 1 });
apiCommentSchema.index({ isRead: 1 });
apiCommentSchema.index({ status: 1 });

// Update unread count on API endpoint when comment is created
apiCommentSchema.post('save', async function() {
  if (!this.isRead) {
    const ApiEndpoint = mongoose.model('ApiEndpoint');
    await ApiEndpoint.findByIdAndUpdate(this.apiEndpoint, {
      $inc: { unreadCommentsCount: 1 }
    });
  }
});

// Update unread count when comment is marked as read
apiCommentSchema.pre('save', async function(next) {
  if (this.isModified('isRead') && this.isRead) {
    const ApiEndpoint = mongoose.model('ApiEndpoint');
    await ApiEndpoint.findByIdAndUpdate(this.apiEndpoint, {
      $inc: { unreadCommentsCount: -1 }
    });
  }
  next();
});

module.exports = mongoose.model('ApiComment', apiCommentSchema);
