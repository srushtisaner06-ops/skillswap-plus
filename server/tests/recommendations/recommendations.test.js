const {
  app,
  request,
  registerUser,
  authHeader,
  createSessionFor,
  futureDate
} = require('../helpers');
const User = require('../../src/models/User');
const Booking = require('../../src/models/Booking');
const { BOOKING_STATUS } = require('../../src/models/Booking');
const { SESSION_STATUS } = require('../../src/utils/constants');
const {
  calculateSkillOverlap,
  computeRecommendationScore
} = require('../../src/utils/recommendationEngine');

describe('session recommendation engine', () => {
  test('scores skill and category matches above unrelated sessions', () => {
    const user = {
      skillsWanted: ['React'],
      skillsOffered: [{ name: 'Design Systems' }]
    };
    const matching = {
      title: 'React performance workshop',
      skillCategory: 'Programming',
      tags: ['react', 'frontend'],
      host: { rating: 4.8, ratingCount: 12 },
      participants: [],
      requests: []
    };
    const unrelated = {
      title: 'Finance fundamentals',
      skillCategory: 'Finance',
      tags: ['budgeting'],
      host: { rating: 4.8, ratingCount: 12 },
      participants: [],
      requests: []
    };

    expect(calculateSkillOverlap(user, matching)).toBeGreaterThan(0);
    expect(computeRecommendationScore({ user, session: matching }).score)
      .toBeGreaterThan(computeRecommendationScore({ user, session: unrelated }).score);
  });

  test('GET /api/recommendations returns personalized, deduped session recommendations', async () => {
    const learner = await registerUser({ name: 'Recommendation Learner', email: 'recommendations@example.com' });
    const mentor = await registerUser({ name: 'React Mentor', email: 'react.mentor@example.com' });
    const otherMentor = await registerUser({ name: 'Finance Mentor', email: 'finance.mentor@example.com' });

    await User.findByIdAndUpdate(learner.id, {
      skillsWanted: ['React', 'Design'],
      skillsOffered: [{ name: 'Figma', level: 80 }]
    });
    await User.findByIdAndUpdate(mentor.id, { rating: 4.9, ratingCount: 14 });
    await User.findByIdAndUpdate(otherMentor.id, { rating: 4.2, ratingCount: 2 });

    const completedSession = await createSessionFor(mentor, {
      title: 'Completed React fundamentals',
      skillCategory: 'Programming',
      tags: ['react', 'frontend'],
      status: SESSION_STATUS.COMPLETED,
      date: futureDate(-10),
      scheduledAt: new Date(futureDate(-10))
    });
    await Booking.create({
      learner: learner.id,
      mentor: mentor.id,
      session: completedSession._id,
      status: BOOKING_STATUS.COMPLETED,
      creditsReserved: 3,
      scheduledAt: completedSession.scheduledAt,
      completedAt: new Date()
    });

    const match = await createSessionFor(mentor, {
      title: 'Advanced React patterns',
      skillCategory: 'Programming',
      tags: ['react', 'frontend'],
      creditsRequired: 8
    });
    const alreadyBooked = await createSessionFor(mentor, {
      title: 'React hooks already booked',
      skillCategory: 'Programming',
      tags: ['react', 'hooks']
    });
    await Booking.create({
      learner: learner.id,
      mentor: mentor.id,
      session: alreadyBooked._id,
      status: BOOKING_STATUS.PENDING,
      creditsReserved: 3,
      scheduledAt: alreadyBooked.scheduledAt
    });

    await createSessionFor(otherMentor, {
      title: 'Personal finance basics',
      skillCategory: 'Finance',
      tags: ['budgeting', 'planning'],
      creditsRequired: 4
    });

    const response = await request(app)
      .get('/api/recommendations?limit=4')
      .set(authHeader(learner.token));

    expect(response.status).toBe(200);
    const recommendations = response.body.data.recommendations;
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.map((item) => item.sessionId)).not.toContain(alreadyBooked._id.toString());
    expect(recommendations[0]).toMatchObject({
      sessionId: match._id.toString(),
      title: 'Advanced React patterns',
      category: 'Programming',
      mentor: { name: 'React Mentor' },
      credits: 8
    });
    expect(recommendations[0].score).toBeGreaterThan(0);
    expect(recommendations[0].scoreBreakdown.skillOverlap).toBeGreaterThan(0);
    expect(new Set(recommendations.map((item) => item.sessionId)).size).toBe(recommendations.length);
  });
});
