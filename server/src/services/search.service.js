const Session = require('../models/Session');
const User = require('../models/User');
const { SKILL_CATEGORIES, SESSION_STATUS } = require('../utils/constants');

const MAX_QUERY_LENGTH = 60;
const RESULT_LIMIT = 6;

function normalizeQuery(value = '') {
  return String(value)
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPrefixRegex(query) {
  return new RegExp(`^${escapeRegex(query)}`, 'i');
}

function buildContainsRegex(query) {
  return new RegExp(escapeRegex(query), 'i');
}

function textScore(value, query, exactWeight, prefixWeight, containsWeight) {
  const haystack = String(value || '').toLowerCase();
  const needle = query.toLowerCase();
  if (!haystack || !needle) return 0;
  if (haystack === needle) return exactWeight;
  if (haystack.startsWith(needle)) return prefixWeight;
  if (haystack.includes(needle)) return containsWeight;
  return 0;
}

function scoreSession(session, query) {
  const tagScore = Math.max(...(session.tags || []).map((tag) => textScore(tag, query, 30, 20, 10)), 0);
  return Math.max(
    textScore(session.title, query, 100, 80, 50),
    textScore(session.skillCategory, query, 35, 25, 15),
    tagScore
  );
}

function scoreMentor(user, query) {
  const offeredScore = Math.max(
    ...(user.skillsOffered || []).map((skill) => textScore(skill.name, query, 70, 55, 35)),
    0
  );
  const wantedScore = Math.max(
    ...(user.skillsWanted || []).map((skill) => textScore(skill, query, 30, 20, 10)),
    0
  );
  return Math.max(
    textScore(user.name, query, 65, 50, 30),
    offeredScore,
    wantedScore
  );
}

function sessionResult(session) {
  return {
    id: session._id,
    title: session.title,
    type: 'session',
    metadata: {
      category: session.skillCategory,
      creditsRequired: session.creditsRequired,
      date: session.date,
      startTime: session.startTime,
      status: session.status,
      hostName: session.host?.name || 'Mentor'
    },
    href: '#/marketplace',
    sessionId: session._id
  };
}

function mentorResult(user) {
  const skills = (user.skillsOffered || []).map((skill) => skill.name).filter(Boolean).slice(0, 3);
  return {
    id: user._id,
    name: user.name,
    title: user.name,
    type: 'mentor',
    metadata: {
      role: user.role,
      rating: user.rating,
      ratingCount: user.ratingCount,
      skills,
      profilePicture: user.profilePicture
    },
    href: '#/profile',
    mentorId: user._id
  };
}

function skillResult(name, source, query) {
  return {
    id: `${source}:${name.toLowerCase()}`,
    title: name,
    name,
    type: 'skill',
    metadata: { source },
    href: '#/marketplace',
    score: textScore(name, query, 90, 65, 35)
  };
}

async function search(queryValue) {
  const query = normalizeQuery(queryValue);
  if (!query || query.length < 2) {
    return { sessions: [], mentors: [], skills: [] };
  }

  const prefixRegex = buildPrefixRegex(query);
  const containsRegex = buildContainsRegex(query);

  const [sessions, mentors, sessionSkills, userSkills] = await Promise.all([
    Session.find({
      status: { $in: [SESSION_STATUS.OPEN, SESSION_STATUS.FULL, SESSION_STATUS.IN_PROGRESS] },
      $or: [
        { title: prefixRegex },
        { skillCategory: prefixRegex },
        { tags: prefixRegex }
      ]
    })
      .select('title skillCategory creditsRequired date startTime status tags host')
      .sort({ status: 1, scheduledAt: 1 })
      .limit(RESULT_LIMIT * 2)
      .populate('host', 'name profilePicture')
      .lean(),
    User.find({
      $or: [
        { name: prefixRegex },
        { 'skillsOffered.name': prefixRegex },
        { skillsWanted: prefixRegex }
      ]
    })
      .select('name role rating ratingCount profilePicture skillsOffered skillsWanted')
      .sort({ rating: -1, ratingCount: -1 })
      .limit(RESULT_LIMIT * 2)
      .lean(),
    Session.find({
      $or: [{ skillCategory: prefixRegex }, { tags: prefixRegex }]
    })
      .select('skillCategory tags')
      .limit(40)
      .lean(),
    User.find({
      $or: [{ 'skillsOffered.name': prefixRegex }, { skillsWanted: prefixRegex }]
    })
      .select('skillsOffered skillsWanted')
      .limit(40)
      .lean()
  ]);

  const skillsByName = new Map();
  SKILL_CATEGORIES.filter((category) => containsRegex.test(category)).forEach((category) => {
    skillsByName.set(category.toLowerCase(), skillResult(category, 'category', query));
  });

  sessionSkills.forEach((session) => {
    [session.skillCategory, ...(session.tags || [])].filter(Boolean).forEach((skill) => {
      const key = String(skill).toLowerCase();
      if (!skillsByName.has(key) && containsRegex.test(skill)) {
        skillsByName.set(key, skillResult(skill, 'session', query));
      }
    });
  });

  userSkills.forEach((user) => {
    [
      ...(user.skillsOffered || []).map((skill) => skill.name),
      ...(user.skillsWanted || [])
    ].filter(Boolean).forEach((skill) => {
      const key = String(skill).toLowerCase();
      if (!skillsByName.has(key) && containsRegex.test(skill)) {
        skillsByName.set(key, skillResult(skill, 'mentor', query));
      }
    });
  });

  const sortByScore = (items, scorer) => items
    .map((item) => ({ item, score: scorer(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULT_LIMIT)
    .map(({ item }) => item);

  return {
    sessions: sortByScore(sessions, scoreSession).map(sessionResult),
    mentors: sortByScore(mentors, scoreMentor).map(mentorResult),
    skills: Array.from(skillsByName.values())
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, RESULT_LIMIT)
      .map(({ score, ...skill }) => skill)
  };
}

module.exports = {
  search,
  normalizeQuery,
  MAX_QUERY_LENGTH
};
