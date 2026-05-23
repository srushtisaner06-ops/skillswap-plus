/* ═══════════════════════════════════════════
   Credit Service — Atomic Transactions
   ═══════════════════════════════════════════ */

const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { TRANSACTION_TYPE } = require('../utils/constants');
const AppError = require('../utils/AppError');

function logEscrowEvent(event, details) {
  console.info(JSON.stringify({ level: 'info', type: 'audit', event, ...details }));
}

/**
 * Transfer credits from one user to another (atomic).
 * Used when a session request is accepted.
 *
 * @param {string} fromUserId - Learner (spender)
 * @param {string} toUserId   - Teacher (earner)
 * @param {number} amount     - Credits to transfer
 * @param {string} sessionId  - Related session
 * @param {string} sessionTitle - Session title for description
 */
const transferCredits = async (fromUserId, toUserId, amount, sessionId, sessionTitle) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1) Deduct from learner — use findOneAndUpdate with $gte guard
    const learner = await User.findOneAndUpdate(
      { _id: fromUserId, credits: { $gte: amount } },
      { $inc: { credits: -amount } },
      { new: true, session }
    );

    if (!learner) {
      throw new AppError('Insufficient credits to complete this transaction.', 400);
    }

    // 2) Add to teacher
    const teacher = await User.findByIdAndUpdate(
      toUserId,
      { $inc: { credits: amount } },
      { new: true, session }
    );

    if (!teacher) {
      throw new AppError('Teacher account not found.', 404);
    }

    // 3) Create transaction records (spend + earn)
    await Transaction.create(
      [
        {
          user: fromUserId,
          type: TRANSACTION_TYPE.SPEND,
          amount: -amount,
          balance: learner.credits,
          description: `Spent ${amount} credits for session: "${sessionTitle}"`,
          relatedSession: sessionId,
          relatedUser: toUserId
        },
        {
          user: toUserId,
          type: TRANSACTION_TYPE.EARN,
          amount: amount,
          balance: teacher.credits,
          description: `Earned ${amount} credits for teaching: "${sessionTitle}"`,
          relatedSession: sessionId,
          relatedUser: fromUserId
        }
      ],
      { session }
    );

    // 4) Commit
    await session.commitTransaction();

    return { learnerBalance: learner.credits, teacherBalance: teacher.credits };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Reserve learner credits for a booking. Credits leave the learner balance but
 * are not paid to the mentor until completion.
 */
const reserveCredits = async (learnerId, amount, sessionId, mentorId, sessionTitle, dbSession, bookingId) => {
  const learner = await User.findOneAndUpdate(
    { _id: learnerId, credits: { $gte: amount } },
    { $inc: { credits: -amount } },
    { new: true, session: dbSession }
  );

  if (!learner) {
    throw new AppError('Insufficient credits to reserve this booking.', 400);
  }

  await Transaction.create(
    [
      {
        user: learnerId,
        type: TRANSACTION_TYPE.SPEND,
        amount: -amount,
        balance: learner.credits,
        description: `Reserved ${amount} credits in escrow for: "${sessionTitle}"`,
        relatedSession: sessionId,
        relatedBooking: bookingId,
        relatedUser: mentorId
      }
    ],
    { session: dbSession }
  );

  logEscrowEvent('escrow.reserve', {
    learnerId: String(learnerId),
    mentorId: String(mentorId),
    sessionId: String(sessionId),
    bookingId: String(bookingId),
    amount
  });

  return learner.credits;
};

/**
 * Release reserved credits to the mentor after the booking is completed.
 */
const releaseReservedCredits = async (mentorId, amount, sessionId, learnerId, sessionTitle, dbSession, bookingId) => {
  const mentor = await User.findByIdAndUpdate(
    mentorId,
    { $inc: { credits: amount, 'stats.creditsEarned': amount, 'stats.sessionsTaught': 1 } },
    { new: true, session: dbSession }
  );

  if (!mentor) {
    throw new AppError('Mentor account not found.', 404);
  }

  await Transaction.create(
    [
      {
        user: mentorId,
        type: TRANSACTION_TYPE.EARN,
        amount,
        balance: mentor.credits,
        description: `Released ${amount} escrow credits for teaching: "${sessionTitle}"`,
        relatedSession: sessionId,
        relatedBooking: bookingId,
        relatedUser: learnerId
      }
    ],
    { session: dbSession }
  );

  logEscrowEvent('escrow.release', {
    mentorId: String(mentorId),
    learnerId: String(learnerId),
    sessionId: String(sessionId),
    bookingId: String(bookingId),
    amount
  });

  return mentor.credits;
};

/**
 * Refund reserved credits to the learner when a pending/accepted booking ends
 * without completion.
 */
const refundReservedCredits = async (learnerId, amount, sessionId, mentorId, sessionTitle, reason, dbSession, bookingId) => {
  const learner = await User.findByIdAndUpdate(
    learnerId,
    { $inc: { credits: amount } },
    { new: true, session: dbSession }
  );

  if (!learner) {
    throw new AppError('Learner account not found.', 404);
  }

  await Transaction.create(
    [
      {
        user: learnerId,
        type: TRANSACTION_TYPE.REFUND,
        amount,
        balance: learner.credits,
        description: `${reason || 'Refunded'} ${amount} escrow credits for: "${sessionTitle}"`,
        relatedSession: sessionId,
        relatedBooking: bookingId,
        relatedUser: mentorId
      }
    ],
    { session: dbSession }
  );

  logEscrowEvent('escrow.refund', {
    learnerId: String(learnerId),
    mentorId: String(mentorId),
    sessionId: String(sessionId),
    bookingId: String(bookingId),
    amount,
    reason: reason || 'Refunded'
  });

  return learner.credits;
};

/**
 * Add bonus credits to a user (for streaks, promotions, etc.).
 */
const addBonusCredits = async (userId, amount, reason = 'System bonus') => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: amount } },
      { new: true, session: dbSession }
    );

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    await Transaction.create(
      [
        {
          user: userId,
          type: TRANSACTION_TYPE.BONUS,
          amount,
          balance: user.credits,
          description: reason
        }
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    return user.credits;
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
};

/**
 * Get user's credit balance.
 */
const getBalance = async (userId) => {
  const user = await User.findById(userId).select('credits');
  if (!user) throw new AppError('User not found.', 404);
  return user.credits;
};

/**
 * Get paginated transaction history for a user.
 */
const getTransactionHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedUser', 'name profilePicture')
      .populate('relatedSession', 'title')
      .lean(),
    Transaction.countDocuments({ user: userId })
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  transferCredits,
  reserveCredits,
  releaseReservedCredits,
  refundReservedCredits,
  addBonusCredits,
  getBalance,
  getTransactionHistory
};
