/* ═══════════════════════════════════════════
   Session Service — Business Logic
   ═══════════════════════════════════════════ */

const Session = require('../models/Session');
const { SESSION_STATUS, REQUEST_STATUS } = require('../utils/constants');

/**
 * Detect time conflicts for a user on a given date.
 * Returns conflicting sessions if any exist.
 */
const detectTimeConflict = async (userId, date, startTime, endTime) => {
  // Parse date to start/end of day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Find sessions on the same day the user is part of (as host or participant)
  const sessions = await Session.find({
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $in: [SESSION_STATUS.OPEN, SESSION_STATUS.FULL, SESSION_STATUS.IN_PROGRESS] },
    $or: [
      { host: userId },
      { participants: userId }
    ]
  }).lean();

  // Check for time overlap
  const conflicts = sessions.filter((s) => {
    return startTime < s.endTime && endTime > s.startTime;
  });

  return conflicts;
};

/**
 * Get filtered and paginated sessions.
 */
const getFilteredSessions = async (query) => {
  const {
    page = 1,
    limit = 10,
    category,
    status = SESSION_STATUS.OPEN,
    search,
    sortBy = 'date',
    order = 'asc'
  } = query;

  const filter = { status };

  if (category) {
    filter.skillCategory = category;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = {};
  const sortField = sortBy === 'credits' ? 'creditsRequired' : sortBy;
  sort[sortField] = order === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    Session.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('host', 'name profilePicture rating skillsOffered')
      .populate('participants', 'name profilePicture')
      .lean(),
    Session.countDocuments(filter)
  ]);

  return {
    sessions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Calculate session duration in minutes from time strings.
 */
const calculateDuration = (startTime, endTime) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
};

module.exports = {
  detectTimeConflict,
  getFilteredSessions,
  calculateDuration
};
