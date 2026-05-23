const crypto = require('crypto');
const env = require('../config/env');

const REFRESH_COOKIE_NAME = 'asep_refresh';

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function parseCookieHeader(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) return cookies;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function getRefreshTokenFromRequest(req) {
  const cookies = parseCookieHeader(req.headers.cookie || '');
  return cookies[REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;
}

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: '/api/auth',
    maxAge: env.REFRESH_COOKIE_MAX_AGE_MS
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined
  });
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress;
}

function redact(value) {
  if (!value) return value;
  const text = String(value);
  if (text.length <= 10) return '[redacted]';
  return `${text.slice(0, 6)}...[redacted]`;
}

function logSecurityEvent(event, req, details = {}) {
  const payload = {
    event,
    requestId: req?.id,
    method: req?.method,
    path: req?.originalUrl,
    userId: req?.user?._id ? String(req.user._id) : undefined,
    ip: req ? getClientIp(req) : undefined,
    userAgent: req?.headers?.['user-agent'],
    ...details
  };

  console.info(JSON.stringify({ level: 'info', type: 'security', ...payload }));
}

function sanitizeForLog(details = {}) {
  const sanitized = { ...details };
  for (const key of Object.keys(sanitized)) {
    if (/token|secret|password|credential/i.test(key)) {
      sanitized[key] = redact(sanitized[key]);
    }
  }
  return sanitized;
}

module.exports = {
  REFRESH_COOKIE_NAME,
  hashToken,
  getRefreshTokenFromRequest,
  setRefreshCookie,
  clearRefreshCookie,
  logSecurityEvent,
  sanitizeForLog
};
