const Joi = require('joi');

const objectId = Joi.string().hex().length(24).messages({
  'string.hex': 'Invalid ID format',
  'string.length': 'Invalid ID format'
});

const createBookingSchema = Joi.object({
  sessionId: objectId.required().messages({
    'any.required': 'Session ID is required'
  })
});

const bookingIdParamSchema = Joi.object({
  id: objectId.required().messages({
    'any.required': 'Booking ID is required'
  })
});

module.exports = {
  createBookingSchema,
  bookingIdParamSchema
};
