const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://skill-switch-new.vercel.app',
  'https://skill-switch-new-2q57.vercel.app'
];

function parseOriginList(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getAllowedOrigins(clientUrl = process.env.CLIENT_URL) {
  return [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...parseOriginList(clientUrl)
  ].filter((origin, index, origins) => origins.indexOf(origin) === index);
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

module.exports = {
  DEFAULT_ALLOWED_ORIGINS,
  getAllowedOrigins,
  isOriginAllowed
};
