const { app, request, registerUser, authHeader, password } = require('../helpers');

describe('auth integration', () => {
  test('register creates a user, returns an access token, and omits sensitive fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com', password });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      credits: 10
    });
    expect(response.body.data.user.password).toBeUndefined();
    expect(response.body.data.user.refreshToken).toBeUndefined();
    expect(response.headers['set-cookie']?.join(';')).toContain('refreshToken=');
  });

  test('login accepts valid credentials and rejects invalid credentials safely', async () => {
    await registerUser({ email: 'login@example.com', password });

    const success = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password });

    expect(success.status).toBe(200);
    expect(success.body.data.accessToken).toEqual(expect.any(String));
    expect(success.body.data.user.password).toBeUndefined();

    const failure = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' });

    expect(failure.status).toBe(401);
    expect(failure.body).toMatchObject({
      status: 'fail',
      message: 'Incorrect email or password.'
    });
    expect(JSON.stringify(failure.body)).not.toMatch(/password.+hash|refreshToken/i);
  });

  test('protected routes require a valid bearer token', async () => {
    const unauthenticated = await request(app).get('/api/users/profile');
    expect(unauthenticated.status).toBe(401);

    const invalid = await request(app)
      .get('/api/users/profile')
      .set(authHeader('not-a-real-token'));
    expect(invalid.status).toBe(401);

    const user = await registerUser({ email: 'profile@example.com' });
    const authenticated = await request(app)
      .get('/api/users/profile')
      .set(authHeader(user.token));

    expect(authenticated.status).toBe(200);
    expect(authenticated.body.data.user.email).toBe('profile@example.com');
  });

  test('refresh rotates the refresh cookie and logout clears the stored session', async () => {
    const agent = request.agent(app);
    const register = await agent
      .post('/api/auth/register')
      .send({ name: 'Refresh User', email: 'refresh@example.com', password });

    expect(register.status).toBe(201);
    const firstAccessToken = register.body.data.accessToken;

    const refresh = await agent.post('/api/auth/refresh').send({});
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toEqual(expect.any(String));
    expect(refresh.body.data.accessToken).not.toBe(firstAccessToken);

    const logout = await agent
      .post('/api/auth/logout')
      .set(authHeader(refresh.body.data.accessToken))
      .send({});
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie']?.join(';')).toContain('refreshToken=;');

    const afterLogout = await agent.post('/api/auth/refresh').send({});
    expect(afterLogout.status).toBe(401);
  });

  test('malformed registration payloads are rejected before user creation', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: '123' });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('fail');
    expect(response.body.message).toMatch(/Name must be at least|valid email|Password/i);
  });
});
