const {
  app,
  request,
  registerUser,
  authHeader,
  createSessionFor,
  objectId
} = require('../helpers');

describe('validation and security safeguards', () => {
  test('invalid Mongo ids and malformed payloads return safe JSON errors', async () => {
    const user = await registerUser({ email: 'validation@example.com' });

    const invalidBookingId = await request(app)
      .get('/api/bookings/not-a-valid-id')
      .set(authHeader(user.token));
    expect(invalidBookingId.status).toBe(400);
    expect(invalidBookingId.body.status).toBe('fail');
    expect(invalidBookingId.body.message).toMatch(/Invalid ID format/i);

    const malformedSession = await request(app)
      .post('/api/sessions')
      .set(authHeader(user.token))
      .send({ title: 'Nope' });
    expect(malformedSession.status).toBe(400);
    expect(malformedSession.body.status).toBe('fail');
    expect(malformedSession.body.message).toMatch(/Description is required|Skill category is required/i);
  });

  test('oversized and syntactically invalid JSON bodies do not crash the server', async () => {
    const oversized = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'x@example.com', password: 'a'.repeat(30 * 1024) }));

    expect(oversized.status).toBe(413);
    expect(oversized.body).toMatchObject({
      status: 'fail',
      message: expect.stringMatching(/too large/i)
    });

    const malformed = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(malformed.status).toBe(400);
    expect(malformed.body.status).toBe('fail');
    expect(malformed.body.message).toMatch(/Malformed JSON/i);
  });

  test('unauthorized booking routes reject access before state changes', async () => {
    const mentor = await registerUser({ email: 'unauth-mentor@example.com' });
    const session = await createSessionFor(mentor);

    const response = await request(app)
      .post('/api/bookings')
      .send({ sessionId: session._id.toString() });

    expect(response.status).toBe(401);
  });

  test('request sanitization neutralizes query selector injection payloads', async () => {
    const mentor = await registerUser({ name: 'Sanitize Mentor', email: 'sanitize@example.com' });
    await createSessionFor(mentor, { title: 'Sanitized Search Session' });

    const response = await request(app)
      .get('/api/search')
      .query({ q: { $gt: '' } });

    expect(response.status).toBe(200);
    expect(response.body.results).toEqual({ sessions: [], mentors: [], skills: [] });
  });

  test('auth rate limiter blocks repeated failed login attempts', async () => {
    let lastResponse;
    for (let i = 0; i < 11; i += 1) {
      lastResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Enable-Rate-Limit-Test', 'true')
        .send({ email: `missing-${objectId()}@example.com`, password: 'WrongPassword123' });
    }

    expect([401, 429]).toContain(lastResponse.status);

    if (lastResponse.status !== 429) {
      lastResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Enable-Rate-Limit-Test', 'true')
        .send({ email: 'still-missing@example.com', password: 'WrongPassword123' });
    }

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body.message).toMatch(/Too many login attempts/i);
  });
});
