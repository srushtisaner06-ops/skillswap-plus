const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: [true, 'Comment must belong to a post']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must have an author']
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters'],
      maxlength: [1500, 'Comment cannot exceed 1500 characters']
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isSolution: {
      type: Boolean,
      default: false
    },
    isRemoved: {
      type: Boolean,
      default: false
    },
    removedAt: Date,
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
commentSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
