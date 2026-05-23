const express = require('express');
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  cancelBooking
} = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth');
const { validate, validateParams } = require('../middleware/validate');
const { createBookingSchema, bookingIdParamSchema } = require('../validators/booking.validator');

router.use(protect);

router.post('/', validate(createBookingSchema), createBooking);
router.get('/me', getMyBookings);
router.get('/:id', validateParams(bookingIdParamSchema), getBookingById);
router.patch('/:id/accept', validateParams(bookingIdParamSchema), acceptBooking);
router.patch('/:id/reject', validateParams(bookingIdParamSchema), rejectBooking);
router.patch('/:id/complete', validateParams(bookingIdParamSchema), completeBooking);
router.patch('/:id/cancel', validateParams(bookingIdParamSchema), cancelBooking);

module.exports = router;
