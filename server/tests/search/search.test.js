const {
  app,
  request,
  registerUser,
  createSessionFor
} = require('../helpers');
const User = require('../../src/models/User');

describe('global search', () => {
  test('returns matching sessions, mentors, and skills with sanitized regex input', async () => {
    const mentor = await registerUser({ name: 'React Mentor', email: 'search-mentor@example.com' });
    await User.findByIdAndUpdate(mentor.id, {
      skillsOffered: [{ name: 'React', level: 90 }],
      skillsWanted: ['Testing'],
      rating: 4.8,
      ratingCount: 12
    });
    await createSessionFor(mentor, {
      title: 'React Testing Patterns',
      skillCategory: 'Programming',
      tags: ['react', 'vitest']
    });

    const response = await request(app).get('/api/search').query({ q: 'React' });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.results.sessions.map((item) => item.title)).toContain('React Testing Patterns');
    expect(response.body.results.mentors.map((item) => item.title)).toContain('React Mentor');
    expect(response.body.results.skills.some((item) => item.title.toLowerCase().includes('react'))).toBe(true);

    const sanitized = await request(app).get('/api/search').query({ q: 'React.*($' });
    expect(sanitized.status).toBe(200);
    expect(sanitized.body.results).toMatchObject({ sessions: [], mentors: [], skills: [] });
  });

  test('short, empty, and oversized search terms are safely handled', async () => {
    const empty = await request(app).get('/api/search').query({ q: '' });
    expect(empty.status).toBe(200);
    expect(empty.body.results).toEqual({ sessions: [], mentors: [], skills: [] });

    const short = await request(app).get('/api/search').query({ q: 'a' });
    expect(short.status).toBe(200);
    expect(short.body.results).toEqual({ sessions: [], mentors: [], skills: [] });

    const oversized = await request(app).get('/api/search').query({ q: 'x'.repeat(61) });
    expect(oversized.status).toBe(400);
    expect(oversized.body.message).toMatch(/less than or equal to 60/i);
  });
});
