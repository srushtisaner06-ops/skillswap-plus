const mongoose = require('mongoose');

const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

const bookingSchema = new mongoose.Schema(
  {
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must have a learner']
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must have a mentor']
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Booking must belong to a session']
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      required: true
    },
    creditsReserved: {
      type: Number,
      required: [true, 'Booking must reserve credits'],
      min: [1, 'Reserved credits must be at least 1']
    },
    meetingUrl: {
      type: String,
      default: '',
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Booking must have a scheduled time']
    },
    acceptedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    rejectedAt: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

bookingSchema.index({ learner: 1, status: 1, scheduledAt: 1 });
bookingSchema.index({ mentor: 1, status: 1, scheduledAt: 1 });
bookingSchema.index({ session: 1, status: 1 });
bookingSchema.index(
  { learner: 1, session: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED] } }
  }
);

bookingSchema.virtual('isActive').get(function () {
  return [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED].includes(this.status);
});

bookingSchema.statics.STATUS = BOOKING_STATUS;

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUS = BOOKING_STATUS;
