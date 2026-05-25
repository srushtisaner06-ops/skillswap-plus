const WEIGHTS = Object.freeze({
  skillOverlap: 0.4,
  categoryMatch: 0.2,
  historySimilarity: 0.15,
  ratingQuality: 0.15,
  popularity: 0.1
});

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueTerms(values = []) {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

function scoreOverlap(sourceTerms = [], targetTerms = []) {
  const source = uniqueTerms(sourceTerms);
  const target = uniqueTerms(targetTerms);
  if (source.length === 0 || target.length === 0) return 0;

  const targetSet = new Set(target);
  const matches = source.filter((term) => targetSet.has(term)).length;
  return matches / Math.max(source.length, 1);
}

function getSessionTerms(session = {}) {
  return uniqueTerms([
    session.skillCategory,
    ...(session.tags || []),
    ...String(session.title || '').split(/\s+/)
  ]);
}

function getUserSkillTerms(user = {}) {
  const offered = (user.skillsOffered || []).map((skill) => skill.name || skill);
  return uniqueTerms([...(user.skillsWanted || []), ...offered]);
}

function calculateSkillOverlap(user = {}, session = {}) {
  return scoreOverlap(getUserSkillTerms(user), getSessionTerms(session));
}

function calculateCategoryMatch(user = {}, session = {}, historyProfile = {}) {
  const userTerms = getUserSkillTerms(user);
  const historyCategories = historyProfile.categories || [];
  const category = normalize(session.skillCategory);
  if (!category) return 0;
  if (historyCategories.map(normalize).includes(category)) return 1;
  if (userTerms.includes(category)) return 1;
  if (userTerms.some((term) => category.includes(term) || term.includes(category))) return 0.65;
  return 0;
}

function calculateHistorySimilarity(session = {}, historyProfile = {}) {
  const historyTerms = uniqueTerms([...(historyProfile.tags || []), ...(historyProfile.categories || [])]);
  return scoreOverlap(historyTerms, getSessionTerms(session));
}

function calculateRatingWeight(host = {}) {
  const rating = Math.max(0, Math.min(Number(host.rating) || 0, 5)) / 5;
  const confidence = Math.min((Number(host.ratingCount) || 0) / 10, 1);
  return (rating * 0.75) + (confidence * 0.25);
}

function calculatePopularityWeight(session = {}) {
  const participantCount = Array.isArray(session.participants) ? session.participants.length : 0;
  const requestCount = Array.isArray(session.requests) ? session.requests.length : 0;
  const capacity = Math.max(Number(session.maxParticipants) || 1, 1);
  return Math.min((participantCount + requestCount * 0.5) / capacity, 1);
}

function computeRecommendationScore({ user, session, historyProfile = {} }) {
  const host = session.host || {};
  const factors = {
    skillOverlap: calculateSkillOverlap(user, session),
    categoryMatch: calculateCategoryMatch(user, session, historyProfile),
    historySimilarity: calculateHistorySimilarity(session, historyProfile),
    ratingQuality: calculateRatingWeight(host),
    popularity: calculatePopularityWeight(session)
  };

  const score = Object.entries(factors).reduce((sum, [key, value]) => {
    return sum + value * WEIGHTS[key];
  }, 0);

  return {
    score: Number(score.toFixed(4)),
    factors
  };
}

function getRelevanceLabel(score) {
  if (score >= 0.7) return 'Strong match';
  if (score >= 0.45) return 'Good match';
  if (score > 0) return 'Relevant';
  return 'Popular session';
}

function getRecommendationReason(user = {}, session = {}, historyProfile = {}, factors = {}) {
  const sessionTags = uniqueTerms(session.tags || []);
  const userSkills = getUserSkillTerms(user);
  const matchingSkill = userSkills.find((skill) => sessionTags.includes(skill) || normalize(session.skillCategory) === skill);

  if (matchingSkill) return `Matched based on your interest in ${matchingSkill}`;
  if (factors.historySimilarity > 0 && historyProfile.categories?.[0]) {
    return `Because you learned ${historyProfile.categories[0]}`;
  }
  if (factors.ratingQuality >= 0.75) return 'Recommended from a highly rated mentor';
  return 'Relevant to your current learning profile';
}

module.exports = {
  WEIGHTS,
  calculateSkillOverlap,
  calculateCategoryMatch,
  calculateHistorySimilarity,
  calculateRatingWeight,
  calculatePopularityWeight,
  computeRecommendationScore,
  getRecommendationReason,
  getRelevanceLabel,
  getSessionTerms,
  getUserSkillTerms,
  uniqueTerms
};
