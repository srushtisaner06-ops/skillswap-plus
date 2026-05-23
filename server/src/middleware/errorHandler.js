/* ═══════════════════════════════════════════
   Global Error Handler
   ═══════════════════════════════════════════ */

const env = require('../config/env');
const { logSecurityEvent } = require('../utils/security');

/**
 * Handle Mongoose CastError (invalid ObjectId).
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return { statusCode: 400, status: 'fail', message };
};

/**
 * Handle Mongoose duplicate key error.
 */
const handleDuplicateKey = (err) => {
  if (!err.keyValue || Object.keys(err.keyValue).length === 0) {
    return { statusCode: 409, status: 'fail', message: 'Duplicate value detected.' };
  }
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate value for "${field}". This ${field} is already in use.`;
  return { statusCode: 409, status: 'fail', message };
};

/**
 * Handle Mongoose validation error.
 */
const handleValidationError = (err) => {
  if (!err.errors || Object.keys(err.errors).length === 0) {
    return { statusCode: 400, status: 'fail', message: 'Validation failed.' };
  }
  const messages = Object.values(err.errors).map((e) => e.message);
  const message = `Validation failed: ${messages.join('. ')}`;
  return { statusCode: 400, status: 'fail', message };
};

/**
 * Handle JWT errors.
 */
const handleJWTError = () => ({
  statusCode: 401,
  status: 'fail',
  message: 'Invalid token. Please log in again.'
});

const handleJWTExpired = () => ({
  statusCode: 401,
  status: 'fail',
  message: 'Your token has expired. Please log in again.'
});

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return { statusCode: 400, status: 'fail', message: 'Uploaded file is too large.' };
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return { statusCode: 400, status: 'fail', message: 'Only one file may be uploaded.' };
  }
  return { statusCode: 400, status: 'fail', message: 'Invalid file upload.' };
};

const handlePayloadTooLarge = () => ({
  statusCode: 413,
  status: 'fail',
  message: 'Request payload is too large.'
});

const handleMalformedJson = () => ({
  statusCode: 400,
  status: 'fail',
  message: 'Malformed JSON request body.'
});

// ─── Main Error Handler ────────────────────

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Something went wrong';

  // Handle specific Mongoose/JWT errors
  if (err.name === 'CastError') {
    const handled = handleCastError(err);
    statusCode = handled.statusCode;
    status = handled.status;
    message = handled.message;
  }

  if (err.code === 11000) {
    const handled = handleDuplicateKey(err);
    statusCode = handled.statusCode;
    status = handled.status;
    message = handled.message;
  }

  if (err.name === 'ValidationError') {
    const handled = handleValidationError(err);
    statusCode = handled.statusCode;
    status = handled.status;
    message = handled.message;
  }

  if (err.name === 'JsonWebTokenError') {
    const handled = handleJWTError();
    statusCode = handled.statusCode;
    status = handled.status;
    message = handled.message;
  }

  if (err.name === 'TokenExpiredError') {
    const handled = handleJWTExpired();
    statusCode = handled.statusCode;
    status = handled.status;
    message = handled.message;
  }

  if (err.name === 'MulterError') {
    const handled = handleMulterError(err);
    statusCode = handled.statusCode;
    status = handled.status;
    message = handled.message;
  }

  if (err.type === 'entity.too.large') {
    const handled = handlePayloadTooLarge();
    statusCode = handled.statusCode;
    status = handled.status;
    message = handled.message;
  }

  if (err.type === 'entity.parse.failed') {
    const handled = handleMalformedJson();
    statusCode = handled.statusCode;
    status = handled.status;
    message = handled.message;
  }

  if (statusCode === 401 || statusCode === 403 || statusCode === 429) {
    logSecurityEvent('request.rejected', req, { statusCode, reason: message });
  }

  // Development: send full error
  if (env.NODE_ENV === 'development') {
    console.error('🔴 ERROR:', err);
    return res.status(statusCode).json({
      status,
      message,
      requestId: req.id,
      error: err,
      stack: err.stack
    });
  }

  // Production: send clean error
  if (err.isOperational || statusCode < 500) {
    return res.status(statusCode).json({ status, message, requestId: req.id });
  }

  // Unknown errors in production — don't leak details
  console.error('🔴 UNEXPECTED ERROR:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.',
    requestId: req.id
  });
};

module.exports = errorHandler;
