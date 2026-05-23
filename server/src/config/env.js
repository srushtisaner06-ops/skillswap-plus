const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const { getAllowedOrigins } = require('../utils/allowedOrigins');

const insecureSecretValues = new Set([
  'skillswap-jwt-secret-change-me-in-production',
  'skillswap-refresh-secret-change-me-in-production',
  'change-me',
  'replace-me'
]);

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

function fail(message) {
  console.error(`[env] ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`[env] ${message}`);
}

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    fail(`Missing required environment variable: ${varName}. Copy .env.example to .env and fill in real values.`);
  }
}

if (isProduction) {
  ['JWT_SECRET', 'JWT_REFRESH_SECRET'].forEach((varName) => {
    if (insecureSecretValues.has(process.env[varName]) || process.env[varName].length < 32) {
      fail(`${varName} must be a strong production secret of at least 32 characters.`);
    }
  });

  if (!process.env.CLIENT_URL || process.env.CLIENT_URL === '*') {
    fail('CLIENT_URL must be a specific origin in production.');
  }
} else {
  ['JWT_SECRET', 'JWT_REFRESH_SECRET'].forEach((varName) => {
    if (insecureSecretValues.has(process.env[varName]) || process.env[varName].length < 24) {
      warn(`${varName} is weak. Use a unique 32+ character value before sharing this environment.`);
    }
  });
}

function parseSameSite(value) {
  const normalized = String(value || 'lax').toLowerCase();
  return ['lax', 'strict', 'none'].includes(normalized) ? normalized : 'lax';
}

function durationToMs(value, fallbackMs) {
  const match = String(value || '').match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * multipliers[unit];
}

const clientOrigins = getAllowedOrigins(process.env.CLIENT_URL);
const sameSite = parseSameSite(process.env.COOKIE_SAMESITE);
const isLocalClient = clientOrigins.every((origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin));
const cookieSecure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : isProduction && !isLocalClient;

if (sameSite === 'none' && !cookieSecure) {
  fail('COOKIE_SAMESITE=none requires COOKIE_SECURE=true.');
}

if (isProduction && !cookieSecure) {
  warn('Refresh cookies are not marked secure because CLIENT_URL is local or COOKIE_SECURE=false. Use HTTPS and COOKIE_SECURE=true for public production.');
}

module.exports = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  DB_CONNECT_RETRIES: parseInt(process.env.DB_CONNECT_RETRIES, 10) || 3,
  DB_CONNECT_RETRY_DELAY_MS: parseInt(process.env.DB_CONNECT_RETRY_DELAY_MS, 10) || 1500,
  REQUIRE_TRANSACTION_DB: process.env.REQUIRE_TRANSACTION_DB !== 'false',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  REFRESH_COOKIE_MAX_AGE_MS: durationToMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d', 7 * 24 * 60 * 60 * 1000),
  DEFAULT_CREDITS: parseInt(process.env.DEFAULT_CREDITS, 10) || 10,
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  CLIENT_URL: clientOrigins[0],
  CLIENT_ORIGINS: clientOrigins,
  COOKIE_SECURE: cookieSecure,
  COOKIE_SAMESITE: sameSite,
  JSON_LIMIT: process.env.JSON_LIMIT || '25kb',
  UPLOAD_MAX_BYTES: parseInt(process.env.UPLOAD_MAX_BYTES, 10) || 2 * 1024 * 1024,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || ''
};
