const {
  app,
  request,
  registerUser,
  authHeader,
  createSessionFor
} = require('../helpers');
const Booking = require('../../src/models/Booking');
const Transaction = require('../../src/models/Transaction');
const User = require('../../src/models/User');
const bookingService = require('../../src/services/booking.service');
const creditService = require('../../src/services/credit.service');

describe('escrow transaction integrity', () => {
  test('failed reservation rolls back booking and ledger writes', async () => {
    const mentor = await registerUser({ email: 'escrow-mentor@example.com' });
    const learner = await registerUser({ email: 'escrow-learner@example.com' });
    const session = await createSessionFor(mentor, { creditsRequired: 4 });

    jest.spyOn(creditService, 'reserveCredits').mockImplementationOnce(async () => {
      throw new Error('Injected reserve failure');
    });

    await expect(bookingService.createBooking(learner.id, session._id)).rejects.toThrow('Injected reserve failure');

    expect(await Booking.countDocuments()).toBe(0);
    expect(await Transaction.countDocuments()).toBe(0);
    expect((await User.findById(learner.id).lean()).credits).toBe(10);
    expect((await User.findById(mentor.id).lean()).credits).toBe(10);
  });

  test('failed release keeps accepted booking and mentor balance unchanged', async () => {
    const mentor = await registerUser({ email: 'release-mentor@example.com' });
    const learner = await registerUser({ email: 'release-learner@example.com' });
    const session = await createSessionFor(mentor, { creditsRequired: 4 });

    const create = await request(app)
      .post('/api/bookings')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString() });
    expect(create.status).toBe(201);

    const accept = await request(app)
      .patch(`/api/bookings/${create.body.data.booking._id}/accept`)
      .set(authHeader(mentor.token))
      .send({});
    expect(accept.status).toBe(200);

    jest.spyOn(creditService, 'releaseReservedCredits').mockImplementationOnce(async () => {
      throw new Error('Injected release failure');
    });

    await expect(bookingService.completeBooking(create.body.data.booking._id, mentor.id)).rejects.toThrow('Injected release failure');

    const booking = await Booking.findById(create.body.data.booking._id).lean();
    expect(booking.status).toBe('accepted');
    expect((await User.findById(learner.id).lean()).credits).toBe(6);
    expect((await User.findById(mentor.id).lean()).credits).toBe(10);

    const ledger = await Transaction.find({ relatedBooking: booking._id }).lean();
    expect(ledger).toHaveLength(1);
    expect(ledger[0].type).toBe('spend');
  });

  test('refund after accepted cancellation restores learner balance without paying mentor', async () => {
    const mentor = await registerUser({ email: 'refund-mentor@example.com' });
    const learner = await registerUser({ email: 'refund-learner@example.com' });
    const session = await createSessionFor(mentor, { creditsRequired: 5 });

    const create = await request(app)
      .post('/api/bookings')
      .set(authHeader(learner.token))
      .send({ sessionId: session._id.toString() });
    expect(create.status).toBe(201);

    const accept = await request(app)
      .patch(`/api/bookings/${create.body.data.booking._id}/accept`)
      .set(authHeader(mentor.token))
      .send({});
    expect(accept.status).toBe(200);

    const cancel = await request(app)
      .patch(`/api/bookings/${create.body.data.booking._id}/cancel`)
      .set(authHeader(learner.token))
      .send({});
    expect(cancel.status).toBe(200);

    expect((await User.findById(learner.id).lean()).credits).toBe(10);
    expect((await User.findById(mentor.id).lean()).credits).toBe(10);

    const ledger = await Transaction.find({ relatedBooking: create.body.data.booking._id }).lean();
    expect(ledger.map((tx) => tx.type).sort()).toEqual(['refund', 'spend']);
  });
});
