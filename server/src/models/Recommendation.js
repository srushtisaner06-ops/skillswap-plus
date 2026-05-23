const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recommendation must belong to a user']
    },
    title: {
      type: String,
      required: [true, 'Recommendation title is required'],
      trim: true,
      maxlength: 140
    },
    category: {
      type: String,
      default: 'Learning',
      trim: true
    },
    reason: {
      type: String,
      required: [true, 'Recommendation reason is required'],
      maxlength: 400
    },
    detail: {
      type: String,
      default: '',
      maxlength: 1000
    },
    sourceType: {
      type: String,
      enum: ['session', 'project', 'resume', 'skill', 'system'],
      default: 'system'
    },
    targetUrl: {
      type: String,
      default: '#/marketplace',
      trim: true
    },
    credits: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['new', 'viewed', 'saved', 'dismissed'],
      default: 'new'
    },
    priority: {
      type: Number,
      default: 3,
      min: 1,
      max: 5
    },
    relatedSkills: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

recommendationSchema.index({ user: 1, status: 1, priority: -1, createdAt: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
