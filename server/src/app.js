/* ═══════════════════════════════════════════
   Express Application Setup
   ═══════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const env = require('./config/env');
require('./config/mongooseGuards');
const { generalLimiter } = require('./middleware/rateLimiter');
const { requestId, sanitizeRequest, suspiciousRequestLogger } = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const { logSecurityEvent } = require('./utils/security');
const { isOriginAllowed } = require('./utils/allowedOrigins');


// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const sessionRoutes = require('./routes/session.routes');
const creditRoutes = require('./routes/credit.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require('./routes/notification.routes');
const bookingRoutes = require('./routes/booking.routes');
const projectResourceRoutes = require('./routes/projectResource.routes');
const resumeRoutes = require('./routes/resume.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const activityRoutes = require('./routes/activity.routes');
const profileCompletionRoutes = require('./routes/profileCompletion.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const communityRoutes = require('./routes/community.routes');
const searchRoutes = require('./routes/search.routes');

const app = express();
app.set('trust proxy', 1);

// ─── Global Middleware ─────────────────────

app.use(requestId);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...env.CLIENT_ORIGINS],
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' }
}));

// CORS
app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin, env.CLIENT_ORIGINS)) {
      return callback(null, true);
    }
    return callback(new AppError('Not allowed by CORS.', 403));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 600
}));

// Request logging
morgan.token('id', (req) => req.id);
if (env.NODE_ENV === 'development') {
  app.use(morgan(':method :url :status :response-time ms - :res[content-length] id=:id'));
} else {
  app.use(morgan(':remote-addr :method :url :status :response-time ms id=:id'));
}

// Body parsing
app.use(express.json({ limit: env.JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.JSON_LIMIT }));
app.use(mongoSanitize({
  onSanitize({ req, key }) {
    logSecurityEvent('request.mongo_sanitized', req, { source: key });
  }
}));
app.use(sanitizeRequest);
app.use(suspiciousRequestLogger);

// Static files (profile pictures)
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR), {
  dotfiles: 'deny',
  index: false,
  maxAge: env.NODE_ENV === 'production' ? '1d' : 0,
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', env.NODE_ENV === 'production' ? 'public, max-age=86400' : 'no-store');
  }
}));

// Rate limiting
app.use('/api', generalLimiter);

// ─── Health Check ──────────────────────────

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SkillSwap+ API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

// ─── API Routes ────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/projects', projectResourceRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/profile-completion', profileCompletionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/search', searchRoutes);

// ─── 404 Handler ───────────────────────────

app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ─── Global Error Handler ──────────────────

app.use(errorHandler);

module.exports = app;
