const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resume must belong to a user']
    },
    title: {
      type: String,
      required: [true, 'Resume title is required'],
      trim: true,
      maxlength: 120
    },
    targetRole: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120
    },
    fileUrl: {
      type: String,
      default: '',
      trim: true
    },
    summary: {
      type: String,
      default: '',
      maxlength: 1500
    },
    skills: [{ type: String, trim: true }],
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['draft', 'reviewed', 'published', 'archived'],
      default: 'draft'
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    lastReviewedAt: Date,
    feedback: [
      {
        note: { type: String, required: true, maxlength: 600 },
        source: { type: String, default: 'mentor', trim: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, updatedAt: -1 });
resumeSchema.index({ user: 1, isPrimary: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
