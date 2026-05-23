/* ═══════════════════════════════════════════
   Joi Validation Middleware
   ═══════════════════════════════════════════ */

const AppError = require('../utils/AppError');

/**
 * Creates a middleware that validates req.body against a Joi schema.
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,       // Return all errors, not just the first
      stripUnknown: true,      // Remove unknown fields
      errors: {
        wrap: { label: '' }    // Don't wrap labels in quotes
      }
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return next(new AppError(messages.join('. '), 400));
    }

    // Replace body with validated/sanitized values
    req.body = value;
    next();
  };
};

/**
 * Validates req.query against a Joi schema.
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      errors: { wrap: { label: '' } }
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return next(new AppError(messages.join('. '), 400));
    }

    req.query = value;
    next();
  };
};

/**
 * Validates req.params against a Joi schema.
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      errors: { wrap: { label: '' } }
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return next(new AppError(messages.join('. '), 400));
    }

    req.params = value;
    next();
  };
};

module.exports = { validate, validateQuery, validateParams };
