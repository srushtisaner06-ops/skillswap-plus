const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { BOOKING_STATUS } = require('../models/Booking');
const Session = require('../models/Session');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { SESSION_STATUS, NOTIFICATION_TYPE, TRANSACTION_TYPE } = require('../utils/constants');
const AppError = require('../utils/AppError');
const creditService = require('./credit.service');
const { createNotification } = require('./notification.service');
const { generateMeetingUrl } = require('../utils/meeting');

function logBookingStage(stage, details = {}) {
  console.info('[booking.lifecycle]', stage, details);
}

function buildScheduledAt(session) {
  const datePart = new Date(session.date).toISOString().split('T')[0];
  return new Date(`${datePart}T${session.startTime}:00.000Z`);
}

async function logBookingVerification(bookingId, expectedStatus) {
  const [persisted, reserveTransactions, releaseTransactions, refundTransactions] = await Promise.all([
    Booking.findById(bookingId).select('status meetingUrl creditsReserved learner mentor session').lean(),
    Transaction.countDocuments({ relatedBooking: bookingId, type: TRANSACTION_TYPE.SPEND }),
    Transaction.countDocuments({ relatedBooking: bookingId, type: TRANSACTION_TYPE.EARN }),
    Transaction.countDocuments({ relatedBooking: bookingId, type: TRANSACTION_TYPE.REFUND })
  ]);

  if (!persisted) {
    logBookingStage('verify:failed', { bookingId: String(bookingId), reason: 'missing booking' });
    throw new AppError('Booking lifecycle verification failed.', 500);
  }

  logBookingStage('verify:state', {
    bookingId: String(bookingId),
    expectedStatus,
    actualStatus: persisted.status,
    meetingUrlAttached: Boolean(persisted.meetingUrl),
    creditsReserved: persisted.creditsReserved,
    ledger: {
      reserved: reserveTransactions,
      released: releaseTransactions,
      refunded: refundTransactions
    }
  });

  if (expectedStatus && persisted.status !== expectedStatus) {
    throw new AppError('Booking lifecycle verification failed.', 500);
  }
}

function populateBooking(query) {
  return query
    .populate('learner', 'name profilePicture rating credits')
    .populate('mentor', 'name profilePicture rating credits')
    .populate('session', 'title description skillCategory date startTime endTime creditsRequired status maxParticipants participants');
}

async function createBooking(userId, sessionId) {
  const dbSession = await mongoose.startSession();
  let booking;
  let targetSession;

  try {
    await dbSession.withTransaction(async () => {
      targetSession = await Session.findById(sessionId).session(dbSession);
      if (!targetSession) throw new AppError('Session not found.', 404);

      if (targetSession.host.toString() === userId.toString()) {
        throw new AppError('You cannot book your own session.', 400);
      }

      if (targetSession.status !== SESSION_STATUS.OPEN) {
        throw new AppError('This session is not open for bookings.', 400);
      }

      if (targetSession.participants.some((id) => id.toString() === userId.toString())) {
        throw new AppError('You are already accepted into this session.', 400);
      }

      if (targetSession.participants.length >= targetSession.maxParticipants) {
        throw new AppError('This session is already full.', 400);
      }

      const existing = await Booking.findOne({
        learner: userId,
        session: sessionId,
        status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED] }
      }).session(dbSession);

      if (existing) {
        throw new AppError('You already have an active booking for this session.', 409);
      }

      logBookingStage('reserve:start', {
        learnerId: String(userId),
        mentorId: String(targetSession.host),
        sessionId: String(targetSession._id),
        credits: targetSession.creditsRequired
      });

      const [created] = await Booking.create(
        [
          {
            learner: userId,
            mentor: targetSession.host,
            session: targetSession._id,
            status: BOOKING_STATUS.PENDING,
            creditsReserved: targetSession.creditsRequired,
            scheduledAt: buildScheduledAt(targetSession)
          }
        ],
        { session: dbSession }
      );

      await creditService.reserveCredits(
        userId,
        targetSession.creditsRequired,
        targetSession._id,
        targetSession.host,
        targetSession.title,
        dbSession,
        created._id
      );

      booking = created;
    });
  } finally {
    dbSession.endSession();
  }

  logBookingStage('reserve:committed', {
    bookingId: String(booking._id),
    sessionId: String(targetSession._id),
    creditsReserved: booking.creditsReserved
  });
  await logBookingVerification(booking._id, BOOKING_STATUS.PENDING);

  await createNotification(
    booking.mentor,
    NOTIFICATION_TYPE.SESSION,
    `New booking request for "${targetSession.title}".`,
    'event',
    'sky',
    '#/dashboard'
  );

  return populateBooking(Booking.findById(booking._id));
}

async function getMyBookings(userId) {
  const [learning, mentoring] = await Promise.all([
    populateBooking(Booking.find({ learner: userId }).sort({ scheduledAt: 1, createdAt: -1 })).lean(),
    populateBooking(Booking.find({ mentor: userId }).sort({ scheduledAt: 1, createdAt: -1 })).lean()
  ]);

  return { learning, mentoring };
}

async function getBookingById(bookingId, userId) {
  const booking = await populateBooking(
    Booking.findOne({
      _id: bookingId,
      $or: [{ learner: userId }, { mentor: userId }]
    })
  );

  if (!booking) throw new AppError('Booking not found.', 404);
  return booking;
}

async function acceptBooking(bookingId, mentorId) {
  const dbSession = await mongoose.startSession();
  let booking;
  let idempotentAccepted = false;

  try {
    await dbSession.withTransaction(async () => {
      booking = await Booking.findOne({
        _id: bookingId,
        mentor: mentorId,
        status: BOOKING_STATUS.PENDING
      }).session(dbSession);

      if (!booking) {
        booking = await Booking.findOne({
          _id: bookingId,
          mentor: mentorId,
          status: BOOKING_STATUS.ACCEPTED
        }).session(dbSession);

        if (booking) {
          idempotentAccepted = true;
          if (!booking.meetingUrl) {
            booking.meetingUrl = generateMeetingUrl(booking._id);
            await booking.save({ session: dbSession });
          }
          return;
        }

        throw new AppError('Pending booking not found or already handled.', 404);
      }

      logBookingStage('accept:start', {
        bookingId: String(booking._id),
        mentorId: String(mentorId),
        learnerId: String(booking.learner)
      });

      const updatedSession = await Session.findOneAndUpdate(
        {
          _id: booking.session,
          host: mentorId,
          status: SESSION_STATUS.OPEN,
          participants: { $ne: booking.learner },
          $expr: { $lt: [{ $size: '$participants' }, '$maxParticipants'] }
        },
        { $addToSet: { participants: booking.learner } },
        { returnDocument: 'after', session: dbSession }
      );

      if (!updatedSession) {
        throw new AppError('Session is full or no longer accepting bookings.', 409);
      }

      if (updatedSession.participants.length >= updatedSession.maxParticipants) {
        updatedSession.status = SESSION_STATUS.FULL;
        await updatedSession.save({ session: dbSession });
      }

      booking.status = BOOKING_STATUS.ACCEPTED;
      booking.acceptedAt = new Date();
      booking.meetingUrl = generateMeetingUrl(booking._id);
      await booking.save({ session: dbSession });
    });
  } finally {
    dbSession.endSession();
  }

  logBookingStage(idempotentAccepted ? 'accept:idempotent' : 'accept:committed', {
    bookingId: String(booking._id),
    meetingUrl: booking.meetingUrl
  });
  await logBookingVerification(booking._id, BOOKING_STATUS.ACCEPTED);

  if (!idempotentAccepted) {
    await createNotification(
      booking.learner,
      NOTIFICATION_TYPE.SESSION,
      'Your booking was accepted. A meeting link is now available.',
      'event_available',
      'emerald',
      '#/session'
    );
  }

  return populateBooking(Booking.findById(booking._id));
}

async function rejectBooking(bookingId, mentorId) {
  const dbSession = await mongoose.startSession();
  let booking;
  let sessionDoc;
  let idempotentRejected = false;

  try {
    await dbSession.withTransaction(async () => {
      booking = await Booking.findOne({
        _id: bookingId,
        mentor: mentorId,
        status: BOOKING_STATUS.PENDING
      }).session(dbSession);

      if (!booking) {
        booking = await Booking.findOne({
          _id: bookingId,
          mentor: mentorId,
          status: BOOKING_STATUS.REJECTED
        }).session(dbSession);

        if (booking) {
          idempotentRejected = true;
          sessionDoc = await Session.findById(booking.session).session(dbSession);
          return;
        }

        throw new AppError('Pending booking not found or already handled.', 404);
      }

      sessionDoc = await Session.findById(booking.session).session(dbSession);
      if (!sessionDoc) throw new AppError('Session not found.', 404);

      logBookingStage('reject:start', {
        bookingId: String(booking._id),
        learnerId: String(booking.learner),
        credits: booking.creditsReserved
      });

      await creditService.refundReservedCredits(
        booking.learner,
        booking.creditsReserved,
        booking.session,
        booking.mentor,
        sessionDoc.title,
        'Refunded',
        dbSession,
        booking._id
      );

      booking.status = BOOKING_STATUS.REJECTED;
      booking.rejectedAt = new Date();
      await booking.save({ session: dbSession });
    });
  } finally {
    dbSession.endSession();
  }

  logBookingStage(idempotentRejected ? 'reject:idempotent' : 'reject:committed', {
    bookingId: String(booking._id)
  });
  await logBookingVerification(booking._id, BOOKING_STATUS.REJECTED);

  if (!idempotentRejected) {
    await createNotification(
      booking.learner,
      NOTIFICATION_TYPE.SESSION,
      `Your booking request for "${sessionDoc.title}" was rejected. Credits were refunded.`,
      'event_busy',
      'amber',
      '#/dashboard'
    );
  }

  return populateBooking(Booking.findById(booking._id));
}

async function cancelBooking(bookingId, userId) {
  const dbSession = await mongoose.startSession();
  let booking;
  let sessionDoc;
  let idempotentCancelled = false;

  try {
    await dbSession.withTransaction(async () => {
      booking = await Booking.findOne({
        _id: bookingId,
        $or: [{ learner: userId }, { mentor: userId }],
        status: { $in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.ACCEPTED] }
      }).session(dbSession);

      if (!booking) {
        booking = await Booking.findOne({
          _id: bookingId,
          $or: [{ learner: userId }, { mentor: userId }],
          status: BOOKING_STATUS.CANCELLED
        }).session(dbSession);

        if (booking) {
          idempotentCancelled = true;
          sessionDoc = await Session.findById(booking.session).session(dbSession);
          return;
        }

        throw new AppError('Active booking not found.', 404);
      }

      sessionDoc = await Session.findById(booking.session).session(dbSession);
      if (!sessionDoc) throw new AppError('Session not found.', 404);

      logBookingStage('cancel:start', {
        bookingId: String(booking._id),
        requestedBy: String(userId),
        previousStatus: booking.status,
        credits: booking.creditsReserved
      });

      if (booking.status === BOOKING_STATUS.ACCEPTED) {
        await Session.findByIdAndUpdate(
          booking.session,
          {
            $pull: { participants: booking.learner },
            $set: { status: SESSION_STATUS.OPEN }
          },
          { session: dbSession }
        );
      }

      await creditService.refundReservedCredits(
        booking.learner,
        booking.creditsReserved,
        booking.session,
        booking.mentor,
        sessionDoc.title,
        'Cancelled and refunded',
        dbSession,
        booking._id
      );

      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancelledAt = new Date();
      await booking.save({ session: dbSession });
    });
  } finally {
    dbSession.endSession();
  }

  logBookingStage(idempotentCancelled ? 'cancel:idempotent' : 'cancel:committed', {
    bookingId: String(booking._id)
  });
  await logBookingVerification(booking._id, BOOKING_STATUS.CANCELLED);

  if (!idempotentCancelled) {
    const notifyUser = booking.learner.toString() === userId.toString() ? booking.mentor : booking.learner;
    await createNotification(
      notifyUser,
      NOTIFICATION_TYPE.SESSION,
      `Booking for "${sessionDoc.title}" was cancelled. Reserved credits were refunded.`,
      'event_busy',
      'amber',
      '#/dashboard'
    );
  }

  return populateBooking(Booking.findById(booking._id));
}

async function completeBooking(bookingId, mentorId) {
  const dbSession = await mongoose.startSession();
  let booking;
  let sessionDoc;
  let idempotentCompleted = false;

  try {
    await dbSession.withTransaction(async () => {
      const completedAt = new Date();
      booking = await Booking.findOne({
        _id: bookingId,
        mentor: mentorId,
        status: BOOKING_STATUS.ACCEPTED
      }).session(dbSession);

      if (!booking) {
        booking = await Booking.findOne({
          _id: bookingId,
          mentor: mentorId,
          status: BOOKING_STATUS.COMPLETED
        }).session(dbSession);

        if (booking) {
          idempotentCompleted = true;
          sessionDoc = await Session.findById(booking.session).session(dbSession);
          return;
        }

        throw new AppError('Accepted booking not found or already completed.', 404);
      }

      booking.status = BOOKING_STATUS.COMPLETED;
      booking.completedAt = completedAt;
      if (!booking.meetingUrl) {
        booking.meetingUrl = generateMeetingUrl(booking._id);
      }
      await booking.save({ session: dbSession });

      sessionDoc = await Session.findById(booking.session).session(dbSession);
      if (!sessionDoc) throw new AppError('Session not found.', 404);

      logBookingStage('complete:start', {
        bookingId: String(booking._id),
        mentorId: String(booking.mentor),
        learnerId: String(booking.learner),
        credits: booking.creditsReserved
      });

      await creditService.releaseReservedCredits(
        booking.mentor,
        booking.creditsReserved,
        booking.session,
        booking.learner,
        sessionDoc.title,
        dbSession,
        booking._id
      );

      await User.findByIdAndUpdate(
        booking.learner,
        { $inc: { 'stats.sessionsAttended': 1 } },
        { session: dbSession }
      );

      const remainingAccepted = await Booking.countDocuments({
        session: booking.session,
        status: BOOKING_STATUS.ACCEPTED,
        _id: { $ne: booking._id }
      }).session(dbSession);

      if (remainingAccepted === 0) {
        sessionDoc.status = SESSION_STATUS.COMPLETED;
        await sessionDoc.save({ session: dbSession });
      }
    });
  } finally {
    dbSession.endSession();
  }

  logBookingStage(idempotentCompleted ? 'complete:idempotent' : 'complete:committed', {
    bookingId: String(booking._id),
    creditsReleased: idempotentCompleted ? 0 : booking.creditsReserved
  });
  await logBookingVerification(booking._id, BOOKING_STATUS.COMPLETED);

  if (!idempotentCompleted) {
    await Promise.allSettled([
      createNotification(
        booking.learner,
        NOTIFICATION_TYPE.SESSION,
        `Session "${sessionDoc.title}" was completed. You can now leave a review.`,
        'rate_review',
        'violet',
        '#/session'
      ),
      createNotification(
        booking.mentor,
        NOTIFICATION_TYPE.CREDIT,
        `${booking.creditsReserved} escrow credits were released for "${sessionDoc.title}".`,
        'account_balance_wallet',
        'emerald',
        '#/settings'
      )
    ]);
  }

  return populateBooking(Booking.findById(booking._id));
}

module.exports = {
  BOOKING_STATUS,
  createBooking,
  getMyBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking
};
