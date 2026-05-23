/* ═══════════════════════════════════════════
   Session Model (Skill Sessions)
   ═══════════════════════════════════════════ */

const mongoose = require('mongoose');
const { SESSION_STATUS, REQUEST_STATUS } = require('../utils/constants');

const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    skillCategory: {
      type: String,
      required: [true, 'Skill category is required'],
      trim: true
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session must have a host']
    },

    date: {
      type: Date,
      required: [true, 'Session date is required']
    },

    scheduledAt: {
      type: Date,
      required: [true, 'Session scheduled time is required']
    },

    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format (e.g. "09:30")']
    },

    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format (e.g. "17:00")']
    },

    duration: {
      type: Number, // in minutes
      min: [15, 'Session must be at least 15 minutes'],
      max: [480, 'Session cannot exceed 8 hours']
    },

    creditsRequired: {
      type: Number,
      required: [true, 'Credits required is required'],
      min: [1, 'Credits must be at least 1'],
      max: [100, 'Credits cannot exceed 100']
    },

    maxParticipants: {
      type: Number,
      default: 1,
      min: 1,
      max: 20
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    requests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        status: {
          type: String,
          enum: Object.values(REQUEST_STATUS),
          default: REQUEST_STATUS.PENDING
        },
        requestedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.OPEN
    },

    meetingUrl: {
      type: String,
      default: '',
      trim: true
    },

    tags: [{ type: String, trim: true }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ─── Indexes ───────────────────────────────

sessionSchema.index({ host: 1, date: 1 });
sessionSchema.index({ host: 1, scheduledAt: 1 });
sessionSchema.index({ status: 1, date: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });
sessionSchema.index({ skillCategory: 1 });
sessionSchema.index({ title: 1 });
sessionSchema.index({ tags: 1 });
sessionSchema.index({ date: 1, startTime: 1, endTime: 1 });

// ─── Virtual: participant count ────────────

sessionSchema.virtual('participantCount').get(function () {
  return this.participants ? this.participants.length : 0;
});

// ─── Virtual: is full ──────────────────────

sessionSchema.virtual('isFull').get(function () {
  return this.participants.length >= this.maxParticipants;
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
