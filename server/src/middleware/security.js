const crypto = require('crypto');
const { logSecurityEvent } = require('../utils/security');

const dangerousKeyPattern = /(^\$)|\./;
const scriptTagPattern = /<\s*\/?\s*script\b/gi;
const eventHandlerPattern = /\son[a-z]+\s*=/gi;
const javascriptUrlPattern = /javascript\s*:/gi;

function requestId(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  req.id = typeof incomingId === 'string' && incomingId.length <= 100
    ? incomingId
    : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

function cleanString(value) {
  return value
    .replace(scriptTagPattern, '')
    .replace(eventHandlerPattern, ' data-removed=')
    .replace(javascriptUrlPattern, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function sanitizeValue(value, state) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, state));
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (dangerousKeyPattern.test(key)) {
        state.removedKeys.push(key);
        delete value[key];
        continue;
      }
      value[key] = sanitizeValue(value[key], state);
    }
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = cleanString(value);
    if (cleaned !== value) state.cleanedStrings += 1;
    return cleaned;
  }

  return value;
}

function sanitizeRequest(req, res, next) {
  const state = { removedKeys: [], cleanedStrings: 0 };

  if (req.body) req.body = sanitizeValue(req.body, state);
  if (req.query) req.query = sanitizeValue(req.query, state);
  if (req.params) req.params = sanitizeValue(req.params, state);

  if (state.removedKeys.length || state.cleanedStrings) {
    logSecurityEvent('request.sanitized', req, {
      removedKeys: state.removedKeys.slice(0, 10),
      cleanedStrings: state.cleanedStrings
    });
  }

  next();
}

function suspiciousRequestLogger(req, res, next) {
  const target = `${req.originalUrl} ${JSON.stringify(req.query || {})}`;
  if (/%24|\$where|\$ne|\$gt|\$regex|<script|javascript:/i.test(target)) {
    logSecurityEvent('request.suspicious', req, { reason: 'suspicious-pattern' });
  }
  next();
}

module.exports = {
  requestId,
  sanitizeRequest,
  suspiciousRequestLogger
};
