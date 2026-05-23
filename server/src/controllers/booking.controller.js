const bookingService = require('../services/booking.service');
const catchAsync = require('../utils/catchAsync');
const { logSecurityEvent } = require('../utils/security');

const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.user._id, req.body.sessionId);
  logSecurityEvent('booking.create', req, { bookingId: String(booking._id), sessionId: req.body.sessionId });

  res.status(201).json({
    status: 'success',
    message: 'Booking requested. Credits are reserved in escrow.',
    data: { booking }
  });
});

const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await bookingService.getMyBookings(req.user._id);

  res.status(200).json({
    status: 'success',
    data: bookings
  });
});

const getBookingById = catchAsync(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user._id);

  res.status(200).json({
    status: 'success',
    data: { booking }
  });
});

const acceptBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.acceptBooking(req.params.id, req.user._id);
  logSecurityEvent('booking.accept', req, { bookingId: req.params.id });

  res.status(200).json({
    status: 'success',
    message: 'Booking accepted. Meeting link generated.',
    data: { booking }
  });
});

const rejectBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.rejectBooking(req.params.id, req.user._id);
  logSecurityEvent('booking.reject', req, { bookingId: req.params.id });

  res.status(200).json({
    status: 'success',
    message: 'Booking rejected and credits refunded.',
    data: { booking }
  });
});

const completeBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.completeBooking(req.params.id, req.user._id);
  logSecurityEvent('booking.complete', req, { bookingId: req.params.id, creditsReleased: booking.creditsReserved });

  res.status(200).json({
    status: 'success',
    message: 'Booking completed and escrow credits released.',
    data: { booking }
  });
});

const cancelBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user._id);
  logSecurityEvent('booking.cancel', req, { bookingId: req.params.id });

  res.status(200).json({
    status: 'success',
    message: 'Booking cancelled and credits refunded.',
    data: { booking }
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  acceptBooking,
  rejectBooking,
  completeBooking,
  cancelBooking
};
