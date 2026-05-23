/* ═══════════════════════════════════════════
   Session Validation Schemas
   ═══════════════════════════════════════════ */

const Joi = require('joi');
const { SKILL_CATEGORIES } = require('../utils/constants');

function minutesFromTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function scheduledDateTime(date, time) {
  const datePart = new Date(date).toISOString().split('T')[0];
  return new Date(`${datePart}T${time}:00.000Z`);
}

const createSessionSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),

  description: Joi.string().trim().min(10).max(2000).required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'any.required': 'Description is required'
    }),

  skillCategory: Joi.string().trim().valid(...SKILL_CATEGORIES).required()
    .messages({
      'any.only': `Category must be one of: ${SKILL_CATEGORIES.join(', ')}`,
      'any.required': 'Skill category is required'
    }),

  date: Joi.date().iso().required()
    .messages({
      'any.required': 'Date is required'
    }),

  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (24-hour)',
      'any.required': 'Start time is required'
    }),

  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (24-hour)',
      'any.required': 'End time is required'
    }),

  creditsRequired: Joi.number().integer().min(1).max(100).required()
    .messages({
      'number.min': 'Credits must be at least 1',
      'number.max': 'Credits cannot exceed 100',
      'any.required': 'Credits required is required'
    }),

  maxParticipants: Joi.number().integer().min(1).max(20).default(1),

  tags: Joi.array().items(Joi.string().trim().min(1).max(30)).max(10).default([])
}).custom((value, helpers) => {
  if (value.endTime <= value.startTime) {
    return helpers.error('any.custom', { message: 'End time must be after start time' });
  }

  const duration = minutesFromTime(value.endTime) - minutesFromTime(value.startTime);
  if (duration < 15) {
    return helpers.error('any.custom', { message: 'Session must be at least 15 minutes' });
  }
  if (duration > 480) {
    return helpers.error('any.custom', { message: 'Session cannot exceed 8 hours' });
  }

  if (scheduledDateTime(value.date, value.startTime) <= new Date()) {
    return helpers.error('any.custom', { message: 'Session start time must be in the future' });
  }

  return value;
}).messages({
  'any.custom': '{{#message}}'
});

const respondRequestSchema = Joi.object({
  userId: Joi.string().hex().length(24).required()
    .messages({
      'any.required': 'User ID is required',
      'string.hex': 'Invalid user ID format',
      'string.length': 'Invalid user ID format'
    }),

  action: Joi.string().valid('accept', 'reject').required()
    .messages({
      'any.only': 'Action must be either "accept" or "reject"',
      'any.required': 'Action is required'
    })
});

const sessionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  category: Joi.string().trim(),
  status: Joi.string().valid('open', 'full', 'completed', 'cancelled'),
  search: Joi.string().trim().max(100),
  sortBy: Joi.string().valid('date', 'scheduledAt', 'credits', 'createdAt').default('date'),
  order: Joi.string().valid('asc', 'desc').default('asc')
});

module.exports = { createSessionSchema, respondRequestSchema, sessionQuerySchema };
