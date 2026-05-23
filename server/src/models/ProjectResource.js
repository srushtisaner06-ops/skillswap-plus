const mongoose = require('mongoose');

const projectResourceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project/resource must belong to a user']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      default: '',
      maxlength: 1200
    },
    type: {
      type: String,
      enum: ['project', 'resource'],
      default: 'project'
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    url: {
      type: String,
      default: '',
      trim: true
    },
    skills: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived'],
      default: 'active'
    },
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private'
    },
    metrics: {
      views: { type: Number, default: 0, min: 0 },
      saves: { type: Number, default: 0, min: 0 }
    }
  },
  { timestamps: true }
);

projectResourceSchema.index({ user: 1, createdAt: -1 });
projectResourceSchema.index({ user: 1, type: 1 });
projectResourceSchema.index({ visibility: 1, status: 1 });

module.exports = mongoose.model('ProjectResource', projectResourceSchema);
