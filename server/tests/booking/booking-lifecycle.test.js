const {
  app,
  request,
  registerUser,
  authHeader,
  createSessionFor,
  setCredits
} = require('../helpers');
const Booking = require('../../src/models/Booking');
const Session = require('../../src/models/Session');
const User = require('../../src/models/User');
const Transaction = require('../../src/models/Transaction');

async function makeBookingFixture(options = {}) {
  const mentor = await registerUser({ name: 'Mentor User', email: options.mentorEmail || 'mentor@example.com' });
  const learner = await registerUser({ name: 'Learner User', email: options.learnerEmail || 'learner@example.com' });
  const session = await createSessionFor(mentor, { creditsRequired: options.creditsRequired || 3 });
  return { mentor, learner, session };
}

describe('booking lifecycle integration', () => {
  test('learner books, mentor accepts, completes, escrow releases, and review is allowed', async () => {
    const { mentor, learner, session } = await makeBookingFixture();

    const create = await request(app)
      .post('/api/bookings')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString() });

    expect(create.status).toBe(201);
    expect(create.body.data.booking.status).toBe('pending');
    expect(create.body.data.booking.creditsReserved).toBe(3);

    let learnerDoc = await User.findById(learner.id).lean();
    let mentorDoc = await User.findById(mentor.id).lean();
    expect(learnerDoc.credits).toBe(7);
    expect(mentorDoc.credits).toBe(10);

    const accept = await request(app)
      .patch(`/api/bookings/${create.body.data.booking._id}/accept`)
      .set(authHeader(mentor.token))
      .send({});

    expect(accept.status).toBe(200);
    expect(accept.body.data.booking.status).toBe('accepted');
    expect(accept.body.data.booking.meetingUrl).toMatch(/^https:\/\/meet\.jit\.si\/skillswap-test-/);

    const complete = await request(app)
      .patch(`/api/bookings/${create.body.data.booking._id}/complete`)
      .set(authHeader(mentor.token))
      .send({});

    expect(complete.status).toBe(200);
    expect(complete.body.data.booking.status).toBe('completed');

    learnerDoc = await User.findById(learner.id).lean();
    mentorDoc = await User.findById(mentor.id).lean();
    expect(learnerDoc.credits).toBe(7);
    expect(mentorDoc.credits).toBe(13);
    expect(mentorDoc.stats.creditsEarned).toBe(3);

    const sessionDoc = await Session.findById(session._id).lean();
    expect(sessionDoc.status).toBe('completed');
    expect(sessionDoc.participants.map(String)).toContain(learner.id);

    const ledger = await Transaction.find({ relatedBooking: create.body.data.booking._id }).lean();
    expect(ledger).toHaveLength(2);
    expect(ledger.map((tx) => tx.type).sort()).toEqual(['earn', 'spend']);

    const review = await request(app)
      .post('/api/reviews')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString(), rating: 5, feedback: 'Great session.' });

    expect(review.status).toBe(201);
  });

  test('review is blocked before the booking is completed', async () => {
    const { mentor, learner, session } = await makeBookingFixture();

    const booking = await request(app)
      .post('/api/bookings')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString() });
    expect(booking.status).toBe(201);

    const review = await request(app)
      .post('/api/reviews')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString(), rating: 4, feedback: 'Too soon.' });

    expect(review.status).toBe(400);

    const mentorReview = await request(app)
      .post('/api/reviews')
      .set(authHeader(mentor.token))
      .send({ sessionId: session._id.toString(), rating: 5, feedback: 'Self review.' });

    expect(mentorReview.status).toBe(400);
  });

  test('duplicate and invalid booking state transitions do not duplicate credits', async () => {
    const { mentor, learner, session } = await makeBookingFixture();

    const first = await request(app)
      .post('/api/bookings')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString() });
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/bookings')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString() });
    expect(duplicate.status).toBe(409);

    const acceptOne = await request(app)
      .patch(`/api/bookings/${first.body.data.booking._id}/accept`)
      .set(authHeader(mentor.token))
      .send({});
    expect(acceptOne.status).toBe(200);

    const acceptTwo = await request(app)
      .patch(`/api/bookings/${first.body.data.booking._id}/accept`)
      .set(authHeader(mentor.token))
      .send({});
    expect(acceptTwo.status).toBe(200);
    expect(acceptTwo.body.data.booking.status).toBe('accepted');

    const completeOne = await request(app)
      .patch(`/api/bookings/${first.body.data.booking._id}/complete`)
      .set(authHeader(mentor.token))
      .send({});
    expect(completeOne.status).toBe(200);

    const completeTwo = await request(app)
      .patch(`/api/bookings/${first.body.data.booking._id}/complete`)
      .set(authHeader(mentor.token))
      .send({});
    expect(completeTwo.status).toBe(200);

    const ledger = await Transaction.find({ relatedBooking: first.body.data.booking._id }).lean();
    expect(ledger.filter((tx) => tx.type === 'spend')).toHaveLength(1);
    expect(ledger.filter((tx) => tx.type === 'earn')).toHaveLength(1);

    const learnerDoc = await User.findById(learner.id).lean();
    const mentorDoc = await User.findById(mentor.id).lean();
    expect(learnerDoc.credits).toBe(7);
    expect(mentorDoc.credits).toBe(13);
  });

  test('cancelling twice is idempotent and refunds only once', async () => {
    const { mentor, learner, session } = await makeBookingFixture();

    const booking = await request(app)
      .post('/api/bookings')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString() });
    expect(booking.status).toBe(201);

    const cancelOne = await request(app)
      .patch(`/api/bookings/${booking.body.data.booking._id}/cancel`)
      .set(authHeader(learner.token))
      .send({});
    expect(cancelOne.status).toBe(200);
    expect(cancelOne.body.data.booking.status).toBe('cancelled');

    const cancelTwo = await request(app)
      .patch(`/api/bookings/${booking.body.data.booking._id}/cancel`)
      .set(authHeader(mentor.token))
      .send({});
    expect(cancelTwo.status).toBe(200);
    expect(cancelTwo.body.data.booking.status).toBe('cancelled');

    const learnerDoc = await User.findById(learner.id).lean();
    expect(learnerDoc.credits).toBe(10);

    const ledger = await Transaction.find({ relatedBooking: booking.body.data.booking._id }).lean();
    expect(ledger.filter((tx) => tx.type === 'spend')).toHaveLength(1);
    expect(ledger.filter((tx) => tx.type === 'refund')).toHaveLength(1);
  });

  test('insufficient credits and self-booking are prevented without partial writes', async () => {
    const { mentor, learner, session } = await makeBookingFixture({ creditsRequired: 6 });
    await setCredits(learner.id, 2);

    const insufficient = await request(app)
      .post('/api/bookings')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString() });

    expect(insufficient.status).toBe(400);
    expect(await Booking.countDocuments()).toBe(0);
    expect(await Transaction.countDocuments()).toBe(0);
    expect((await User.findById(learner.id).lean()).credits).toBe(2);

    const selfBooking = await request(app)
      .post('/api/bookings')
      .set(authHeader(mentor.token))
      .send({ sessionId: session._id.toString() });

    expect(selfBooking.status).toBe(400);
    expect(await Booking.countDocuments()).toBe(0);
  });
});
