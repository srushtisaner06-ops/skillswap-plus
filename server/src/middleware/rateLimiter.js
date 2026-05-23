/* ═══════════════════════════════════════════
   Rate Limiting Configuration
   ═══════════════════════════════════════════ */

const rateLimit = require('express-rate-limit');
const { logSecurityEvent } = require('../utils/security');
const env = require('../config/env');

function skipForAutomatedTests(req) {
  return env.NODE_ENV === 'test' && req.get('x-enable-rate-limit-test') !== 'true';
}

function rateLimitHandler(req, res) {
  logSecurityEvent('request.rate_limited', req, { route: req.baseUrl || req.originalUrl });
  res.status(429).json({
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  });
}

// General API limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: skipForAutomatedTests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

// Auth limiter: 10 attempts per 15 minutes (prevents brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipForAutomatedTests,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    logSecurityEvent('auth.rate_limited', req);
    res.status(429).json({
      status: 'fail',
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }
});

module.exports = { generalLimiter, authLimiter };
