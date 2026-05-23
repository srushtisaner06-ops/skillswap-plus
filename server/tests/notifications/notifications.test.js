const {
  app,
  request,
  registerUser,
  authHeader,
  createNotificationFor
} = require('../helpers');
const Notification = require('../../src/models/Notification');

describe('notifications integration', () => {
  test('notification routes are protected', async () => {
    const response = await request(app).get('/api/notifications');
    expect(response.status).toBe(401);
  });

  test('paginates notifications, counts unread, marks one and all as read', async () => {
    const user = await registerUser({ email: 'notify@example.com' });
    const otherUser = await registerUser({ email: 'notify-other@example.com' });
    await Notification.deleteMany({});

    const first = await createNotificationFor(user.id, { message: 'First unread' });
    await createNotificationFor(user.id, { message: 'Second unread' });
    await createNotificationFor(user.id, { message: 'Already read', read: true });
    await createNotificationFor(otherUser.id, { message: 'Private other user' });

    const page = await request(app)
      .get('/api/notifications')
      .query({ page: 1, limit: 2 })
      .set(authHeader(user.token));

    expect(page.status).toBe(200);
    expect(page.body.data.notifications).toHaveLength(2);
    expect(page.body.data.pagination).toMatchObject({ page: 1, limit: 2, total: 3, pages: 2 });
    expect(page.body.data.notifications.map((notification) => notification.message)).not.toContain('Private other user');

    const unread = await request(app)
      .get('/api/notifications/unread-count')
      .set(authHeader(user.token));
    expect(unread.status).toBe(200);
    expect(unread.body.data.unreadCount).toBe(2);

    const readOne = await request(app)
      .patch(`/api/notifications/${first._id}/read`)
      .set(authHeader(user.token))
      .send({});
    expect(readOne.status).toBe(200);
    expect(readOne.body.data.notification.read).toBe(true);

    const unreadAfterOne = await request(app)
      .get('/api/notifications/unread-count')
      .set(authHeader(user.token));
    expect(unreadAfterOne.body.data.unreadCount).toBe(1);

    const readAll = await request(app)
      .patch('/api/notifications/read-all')
      .set(authHeader(user.token))
      .send({});
    expect(readAll.status).toBe(200);
    expect(readAll.body.data.modifiedCount).toBe(1);

    const unreadAfterAll = await request(app)
      .get('/api/notifications/unread-count')
      .set(authHeader(user.token));
    expect(unreadAfterAll.body.data.unreadCount).toBe(0);
  });

  test('invalid and cross-user notification reads return safe JSON errors', async () => {
    const user = await registerUser({ email: 'notify-owner@example.com' });
    const otherUser = await registerUser({ email: 'notify-reader@example.com' });
    await Notification.deleteMany({});
    const notification = await createNotificationFor(user.id);

    const invalid = await request(app)
      .patch('/api/notifications/not-a-valid-id/read')
      .set(authHeader(user.token))
      .send({});
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toMatch(/Invalid notification id/i);

    const forbiddenByOwnership = await request(app)
      .patch(`/api/notifications/${notification._id}/read`)
      .set(authHeader(otherUser.token))
      .send({});
    expect(forbiddenByOwnership.status).toBe(404);
  });
});
