/* ═══════════════════════════════════════════
   Notification Model
   ═══════════════════════════════════════════ */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../utils/constants');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must belong to a user']
    },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: 500
    },

    icon: {
      type: String,
      default: 'info'
    },

    color: {
      type: String,
      default: 'violet'
    },

    read: {
      type: Boolean,
      default: false
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
  {
    timestamps: true
  }
);

// ─── Indexes ───────────────────────────────

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
