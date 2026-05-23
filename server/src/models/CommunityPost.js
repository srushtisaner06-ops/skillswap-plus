const mongoose = require('mongoose');

const COMMUNITY_CATEGORIES = [
  'General Discussion',
  'UI/UX Craft',
  'Frontend Masters',
  'Product Strategy',
  'Soft Skills',
  'Career',
  'Other'
];

const communityPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must have an author']
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      minlength: [5, 'Post title must be at least 5 characters'],
      maxlength: [140, 'Post title cannot exceed 140 characters']
    },
    body: {
      type: String,
      required: [true, 'Post body is required'],
      trim: true,
      minlength: [10, 'Post body must be at least 10 characters'],
      maxlength: [3000, 'Post body cannot exceed 3000 characters']
    },
    category: {
      type: String,
      enum: COMMUNITY_CATEGORIES,
      default: 'General Discussion'
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [24, 'Tag cannot exceed 24 characters']
      }
    ],
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0
    },
    solvedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ category: 1, createdAt: -1 });
communityPostSchema.index({ tags: 1 });
communityPostSchema.index({ upvoteCount: -1, createdAt: -1 });
communityPostSchema.index({ title: 'text', body: 'text', tags: 'text', category: 'text' });

communityPostSchema.statics.CATEGORIES = COMMUNITY_CATEGORIES;

module.exports = mongoose.model('CommunityPost', communityPostSchema);
module.exports.COMMUNITY_CATEGORIES = COMMUNITY_CATEGORIES;
