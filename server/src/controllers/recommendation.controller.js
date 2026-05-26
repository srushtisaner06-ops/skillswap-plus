const Recommendation = require('../models/Recommendation');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const Activity = require('../models/Activity');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { SESSION_STATUS } = require('../utils/constants');
const { BOOKING_STATUS } = require('../models/Booking');
const {
  computeRecommendationScore,
  getRecommendationReason,
  getRelevanceLabel,
  getSessionTerms,
  getUserSkillTerms,
  uniqueTerms
} = require('../utils/recommendationEngine');

const allowedFields = ['title', 'category', 'reason', 'detail', 'sourceType', 'targetUrl', 'credits', 'status', 'priority', 'relatedSkills'];

function pickAllowed(body) {
  return allowedFields.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});
}

const getMyRecommendations = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 12);

  const userBookings = await Booking.find({ learner: userId })
    .select('session status completedAt scheduledAt')
    .populate({ path: 'session', select: 'title skillCategory tags' })
    .sort({ completedAt: -1, scheduledAt: -1 })
    .limit(100)
    .lean();

  const bookedSessionIds = [
    ...new Set(userBookings.map((booking) => booking.session?._id || booking.session).filter(Boolean).map(String))
  ];
  const completedSessions = userBookings
    .filter((booking) => booking.status === BOOKING_STATUS.COMPLETED && booking.session)
    .map((booking) => booking.session)
    .slice(0, 25);

  const historyProfile = {
    categories: uniqueTerms(completedSessions.map((session) => session.skillCategory)),
    tags: uniqueTerms(completedSessions.flatMap((session) => session.tags || []))
  };

  const interestTerms = uniqueTerms([
    ...getUserSkillTerms(req.user),
    ...historyProfile.categories,
    ...historyProfile.tags
  ]);
  const queryTerms = [...new Set(interestTerms.flatMap((term) => [term, term.replace(/\b\w/g, (char) => char.toUpperCase())]))];
  const categoryTerms = [...new Set([
    ...(req.user.skillsWanted || []),
    ...(req.user.skillsOffered || []).map((skill) => skill.name),
    ...historyProfile.categories
  ].filter(Boolean))];

  const baseFilter = {
    status: SESSION_STATUS.OPEN,
    host: { $ne: userId },
    ...(bookedSessionIds.length ? { _id: { $nin: bookedSessionIds } } : {})
  };

  const personalizedFilter = queryTerms.length
    ? {
        ...baseFilter,
        $or: [
          { skillCategory: { $in: categoryTerms } },
          { tags: { $in: queryTerms } }
        ]
      }
    : baseFilter;

  let candidates = await Session.find(personalizedFilter)
    .select('title description skillCategory host date scheduledAt startTime endTime creditsRequired maxParticipants participants requests status tags')
    .sort({ scheduledAt: 1, createdAt: -1 })
    .limit(60)
    .populate('host', 'name profilePicture rating ratingCount skillsOffered')
    .lean();

  if (candidates.length < limit && queryTerms.length) {
    const existingIds = candidates.map((session) => session._id);
    const fallback = await Session.find({
      ...baseFilter,
      _id: {
        ...(baseFilter._id || {}),
        $nin: [...bookedSessionIds, ...existingIds]
      }
    })
      .select('title description skillCategory host date scheduledAt startTime endTime creditsRequired maxParticipants participants requests status tags')
      .sort({ scheduledAt: 1, createdAt: -1 })
      .limit(40)
      .populate('host', 'name profilePicture rating ratingCount skillsOffered')
      .lean();

    candidates = [...candidates, ...fallback];
  }

  const seen = new Set();
  const recommendations = candidates
    .filter((session) => {
      const key = String(session._id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((session) => {
      const { score, factors } = computeRecommendationScore({ user: req.user, session, historyProfile });
      const reason = getRecommendationReason(req.user, session, historyProfile, factors);
      const relatedSkills = getSessionTerms(session).filter((term) => interestTerms.includes(term)).slice(0, 5);

      return {
        _id: session._id,
        sessionId: session._id,
        title: session.title,
        category: session.skillCategory,
        reason,
        detail: 'Weighted from skill overlap, category fit, completed-session history, mentor rating, and light popularity signals.',
        targetUrl: '#/marketplace',
        credits: session.creditsRequired,
        relatedSkills,
        score,
        relevance: getRelevanceLabel(score),
        scoreBreakdown: factors,
        mentor: session.host ? {
          _id: session.host._id,
          name: session.host.name,
          profilePicture: session.host.profilePicture,
          rating: session.host.rating || 0,
          ratingCount: session.host.ratingCount || 0
        } : null,
        session: {
          _id: session._id,
          title: session.title,
          description: session.description,
          skillCategory: session.skillCategory,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          creditsRequired: session.creditsRequired,
          maxParticipants: session.maxParticipants,
          participantCount: Array.isArray(session.participants) ? session.participants.length : 0,
          status: session.status,
          tags: session.tags || []
        }
      };
    })
    .sort((a, b) => b.score - a.score || (b.mentor?.rating || 0) - (a.mentor?.rating || 0))
    .slice(0, limit);

  res.status(200).json({ status: 'success', data: { recommendations } });
});

const createRecommendation = catchAsync(async (req, res) => {
  const duplicate = await Recommendation.findOne({
    user: req.user._id,
    title: req.body.title,
    sourceType: req.body.sourceType || 'system',
    status: { $ne: 'dismissed' }
  });
  if (duplicate) {
    return res.status(200).json({ status: 'success', data: { recommendation: duplicate } });
  }

  const recommendation = await Recommendation.create({
    ...pickAllowed(req.body),
    user: req.user._id
  });

  await Activity.create({
    user: req.user._id,
    type: 'recommendation',
    title: 'New recommendation',
    message: recommendation.title,
    icon: 'auto_awesome',
    color: 'violet',
    link: recommendation.targetUrl,
    metadata: { recommendationId: recommendation._id }
  });

  res.status(201).json({ status: 'success', data: { recommendation } });
});

const updateRecommendation = catchAsync(async (req, res, next) => {
  const recommendation = await Recommendation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    pickAllowed(req.body),
    { new: true, runValidators: true }
  );

  if (!recommendation) return next(new AppError('Recommendation not found.', 404));
  res.status(200).json({ status: 'success', data: { recommendation } });
});

module.exports = {
  getMyRecommendations,
  createRecommendation,
  updateRecommendation
};
