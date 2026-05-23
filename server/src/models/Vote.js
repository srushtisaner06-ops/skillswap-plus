const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vote must belong to a user']
    },
    targetType: {
      type: String,
      enum: ['post', 'comment'],
      required: true
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetModel'
    },
    targetModel: {
      type: String,
      enum: ['CommunityPost', 'Comment'],
      required: true
    },
    value: {
      type: Number,
      enum: [1],
      default: 1
    }
  },
  { timestamps: true }
);

voteSchema.index({ user: 1, targetType: 1, target: 1 }, { unique: true });
voteSchema.index({ targetType: 1, target: 1 });

module.exports = mongoose.model('Vote', voteSchema);
