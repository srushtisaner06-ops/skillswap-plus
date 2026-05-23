/* ═══════════════════════════════════════════
   Session Controller
   ═══════════════════════════════════════════ */

const Session = require('../models/Session');
const User = require('../models/User');
const { SESSION_STATUS, REQUEST_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');
const sessionService = require('../services/session.service');
const creditService = require('../services/credit.service');
const { createNotification } = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

function buildScheduledAt(date, startTime) {
  const datePart = new Date(date).toISOString().split('T')[0];
  return new Date(`${datePart}T${startTime}:00.000Z`);
}

/**
 * POST /api/sessions
 * Create a new skill session (as teacher/host).
 */
const createSession = catchAsync(async (req, res, next) => {
  const { title, description, skillCategory, date, startTime, endTime, creditsRequired, maxParticipants, tags } = req.body;

  // Validate end time is after start time
  if (endTime <= startTime) {
    return next(new AppError('End time must be after start time.', 400));
  }

  // Check for time conflicts
  const conflicts = await sessionService.detectTimeConflict(req.user._id, date, startTime, endTime);
  if (conflicts.length > 0) {
    return next(new AppError(
      `Time conflict with existing session: "${conflicts[0].title}" (${conflicts[0].startTime} - ${conflicts[0].endTime}).`,
      409
    ));
  }

  // Calculate duration
  const duration = sessionService.calculateDuration(startTime, endTime);
  if (duration < 15 || duration > 480) {
    return next(new AppError('Session duration must be between 15 minutes and 8 hours.', 400));
  }

  const session = await Session.create({
    title,
    description,
    skillCategory,
    host: req.user._id,
    date,
    scheduledAt: buildScheduledAt(date, startTime),
    startTime,
    endTime,
    duration,
    creditsRequired,
    maxParticipants: maxParticipants || 1,
    tags: tags || []
  });

  // Populate host info before responding
  await session.populate('host', 'name profilePicture rating');

  res.status(201).json({
    status: 'success',
    message: 'Session created successfully',
    data: { session }
  });
});

/**
 * GET /api/sessions
 * Browse available sessions with filters & pagination.
 */
const getSessions = catchAsync(async (req, res, next) => {
  const result = await sessionService.getFilteredSessions(req.query);

  res.status(200).json({
    status: 'success',
    data: result
  });
});

/**
 * GET /api/sessions/mine
 * Get sessions I'm hosting or participating in.
 */
const getMySessions = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const [hosting, attending] = await Promise.all([
    Session.find({ host: userId })
      .sort({ date: 1 })
      .populate('participants', 'name profilePicture')
      .lean(),
    Session.find({ participants: userId })
      .sort({ date: 1 })
      .populate('host', 'name profilePicture rating')
      .lean()
  ]);

  res.status(200).json({
    status: 'success',
    data: { hosting, attending }
  });
});

/**
 * GET /api/sessions/:id
 * Get session details by ID.
 */
const getSessionById = catchAsync(async (req, res, next) => {
  const session = await Session.findById(req.params.id)
    .populate('host', 'name profilePicture rating bio skillsOffered')
    .populate('participants', 'name profilePicture')
    .populate('requests.user', 'name profilePicture');

  if (!session) {
    return next(new AppError('Session not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { session }
  });
});

/**
 * POST /api/sessions/:id/request
 * Request to join a session (as learner).
 */
const requestToJoin = catchAsync(async (req, res, next) => {
  const session = await Session.findById(req.params.id);
  const userId = req.user._id;

  if (!session) {
    return next(new AppError('Session not found.', 404));
  }

  // Can't join own session
  if (session.host.toString() === userId.toString()) {
    return next(new AppError('You cannot join your own session.', 400));
  }

  // Check session is open
  if (session.status !== SESSION_STATUS.OPEN) {
    return next(new AppError('This session is no longer accepting requests.', 400));
  }

  // Check if already requested
  const existingRequest = session.requests.find(
    (r) => r.user.toString() === userId.toString()
  );
  if (existingRequest) {
    return next(new AppError(`You have already ${existingRequest.status === 'pending' ? 'requested to join' : 'been ' + existingRequest.status + ' for'} this session.`, 400));
  }

  // Check if already a participant
  if (session.participants.includes(userId)) {
    return next(new AppError('You are already a participant in this session.', 400));
  }

  // Check if session is full
  if (session.participants.length >= session.maxParticipants) {
    return next(new AppError('This session is full.', 400));
  }

  // Check user has enough credits
  const user = await User.findById(userId);
  if (user.credits < session.creditsRequired) {
    return next(new AppError(
      `Insufficient credits. You need ${session.creditsRequired} credits but only have ${user.credits}.`,
      400
    ));
  }

  // Check for time conflicts
  const conflicts = await sessionService.detectTimeConflict(userId, session.date, session.startTime, session.endTime);
  if (conflicts.length > 0) {
    return next(new AppError(
      `Time conflict with your session: "${conflicts[0].title}" (${conflicts[0].startTime} - ${conflicts[0].endTime}).`,
      409
    ));
  }

  // Add request
  session.requests.push({
    user: userId,
    status: REQUEST_STATUS.PENDING,
    requestedAt: new Date()
  });
  await session.save();

  // Notify the host
  await createNotification(
    session.host,
    NOTIFICATION_TYPE.SESSION,
    `${req.user.name} has requested to join your session "${session.title}".`,
    'person_add',
    'sky'
  );

  res.status(200).json({
    status: 'success',
    message: 'Join request sent successfully. The host will review your request.'
  });
});

/**
 * POST /api/sessions/:id/respond
 * Accept or reject a join request (host only).
 */
const respondToRequest = catchAsync(async (req, res, next) => {
  const { userId, action } = req.body;
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new AppError('Session not found.', 404));
  }

  // Only host can respond
  if (session.host.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the session host can respond to requests.', 403));
  }

  // Find the request
  const request = session.requests.find(
    (r) => r.user.toString() === userId && r.status === REQUEST_STATUS.PENDING
  );

  if (!request) {
    return next(new AppError('No pending request found from this user.', 404));
  }

  if (action === 'accept') {
    // Check session isn't full
    if (session.participants.length >= session.maxParticipants) {
      return next(new AppError('Session is already full.', 400));
    }

    // Transfer credits (atomic)
    await creditService.transferCredits(
      userId,                    // learner (from)
      req.user._id,             // teacher (to)
      session.creditsRequired,
      session._id,
      session.title
    );

    // Add to participants
    session.participants.push(userId);
    request.status = REQUEST_STATUS.ACCEPTED;

    // Mark full if needed
    if (session.participants.length >= session.maxParticipants) {
      session.status = SESSION_STATUS.FULL;
    }

    await session.save();

    // Notify learner
    await createNotification(
      userId,
      NOTIFICATION_TYPE.SESSION,
      `Your request to join "${session.title}" has been accepted! ${session.creditsRequired} credits have been deducted.`,
      'event_available',
      'emerald'
    );

    // Notify host about credit
    await createNotification(
      req.user._id,
      NOTIFICATION_TYPE.CREDIT,
      `You earned ${session.creditsRequired} credits from ${request.user.name || 'a learner'} for "${session.title}".`,
      'account_balance_wallet',
      'emerald'
    );

    res.status(200).json({
      status: 'success',
      message: 'Request accepted. Credits transferred successfully.'
    });
  } else {
    // Reject
    request.status = REQUEST_STATUS.REJECTED;
    await session.save();

    // Notify learner
    await createNotification(
      userId,
      NOTIFICATION_TYPE.SESSION,
      `Your request to join "${session.title}" was not accepted.`,
      'event_busy',
      'amber'
    );

    res.status(200).json({
      status: 'success',
      message: 'Request rejected.'
    });
  }
});

/**
 * PATCH /api/sessions/:id/complete
 * Mark a session as completed (host only).
 */
const completeSession = catchAsync(async (req, res, next) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    return next(new AppError('Session not found.', 404));
  }

  // Only host can complete
  if (session.host.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the session host can mark it as completed.', 403));
  }

  // Must have participants
  if (session.participants.length === 0) {
    return next(new AppError('Cannot complete a session with no participants.', 400));
  }

  // Can only complete open or full sessions
  if (![SESSION_STATUS.OPEN, SESSION_STATUS.FULL].includes(session.status)) {
    return next(new AppError(`Cannot complete a session with status "${session.status}".`, 400));
  }

  session.status = SESSION_STATUS.COMPLETED;
  await session.save();

  // Notify all participants that they can now leave reviews
  await Promise.allSettled(
    session.participants.map((participantId) =>
      createNotification(
        participantId,
        NOTIFICATION_TYPE.SESSION,
        `Session "${session.title}" has been completed. You can now leave a review!`,
        'rate_review',
        'violet'
      )
    )
  );

  res.status(200).json({
    status: 'success',
    message: 'Session marked as completed. Participants can now leave reviews.'
  });
});

module.exports = {
  createSession,
  getSessions,
  getMySessions,
  getSessionById,
  requestToJoin,
  respondToRequest,
  completeSession
};
