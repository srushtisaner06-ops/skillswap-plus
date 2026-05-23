const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity must belong to a user']
    },
    type: {
      type: String,
      enum: ['session', 'credit', 'review', 'project', 'resume', 'recommendation', 'profile', 'system'],
      default: 'system'
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true,
      maxlength: 140
    },
    message: {
      type: String,
      required: [true, 'Activity message is required'],
      maxlength: 600
    },
    icon: {
      type: String,
      default: 'info'
    },
    color: {
      type: String,
      default: 'violet'
    },
    link: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Activity', activitySchema);
