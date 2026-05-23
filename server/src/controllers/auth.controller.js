/* ═══════════════════════════════════════════
   Auth Controller
   ═══════════════════════════════════════════ */

const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../services/auth.service');
const { verifyGoogleToken } = require('../services/google.service');
const { createNotification } = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const {
  hashToken,
  getRefreshTokenFromRequest,
  setRefreshCookie,
  clearRefreshCookie,
  logSecurityEvent
} = require('../utils/security');

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    credits: user.credits,
    role: user.role,
    profilePicture: user.profilePicture
  };
}

async function issueAuthSession(user, res, req, event) {
  const tokens = generateTokenPair(user._id);
  user.refreshToken = hashToken(tokens.refreshToken);
  await user.save({ validateBeforeSave: false });
  setRefreshCookie(res, tokens.refreshToken);
  logSecurityEvent(event, req, { subjectUserId: String(user._id) });
  return tokens;
}

/**
 * POST /api/auth/register
 * Register a new user account.
 */
const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  // Create user with default credits
  const user = await User.create({
    name,
    email,
    password,
    authProvider: 'local',
    credits: env.DEFAULT_CREDITS
  });

  const tokens = await issueAuthSession(user, res, req, 'auth.register.success');

  // Welcome notification
  await createNotification(
    user._id,
    'system',
    `Welcome to SkillSwap+! You start with ${env.DEFAULT_CREDITS} credits. Start learning or teaching today!`,
    'celebration',
    'emerald'
  );

  res.status(201).json({
    status: 'success',
    message: 'Account created successfully',
    data: {
      user: publicUser(user),
      accessToken: tokens.accessToken
    }
  });
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens.
 */
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.password || !(await user.comparePassword(password))) {
    logSecurityEvent('auth.login.failure', req, { email });
    return next(new AppError('Incorrect email or password.', 401));
  }

  const tokens = await issueAuthSession(user, res, req, 'auth.login.success');

  res.status(200).json({
    status: 'success',
    message: 'Logged in successfully',
    data: {
      user: publicUser(user),
      accessToken: tokens.accessToken
    }
  });
});

/**
 * POST /api/auth/google
 * Authenticate or register a user via Google OAuth.
 * Accepts { credential } — the Google ID token from frontend GIS.
 */
const googleAuth = catchAsync(async (req, res, next) => {
  const { credential } = req.body;

  if (!credential) {
    return next(new AppError('Google credential token is required.', 400));
  }

  // Verify the Google ID token
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(credential);
  } catch (err) {
    logSecurityEvent('auth.google.failure', req);
    return next(new AppError('Invalid Google token. Please try again.', 401));
  }

  const { googleId, email, name, picture } = googleUser;

  // Check if user exists by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  let isNewUser = false;

  if (!user) {
    // Create new user from Google profile
    isNewUser = true;
    user = await User.create({
      name,
      email,
      googleId,
      authProvider: 'google',
      profilePicture: picture || '',
      credits: env.DEFAULT_CREDITS
    });

    // Welcome notification for new Google users
    await createNotification(
      user._id,
      'system',
      `Welcome to SkillSwap+! You start with ${env.DEFAULT_CREDITS} credits. Start learning or teaching today!`,
      'celebration',
      'emerald'
    );
  } else if (!user.googleId) {
    // Existing email user — link their Google account
    user.googleId = googleId;
    user.authProvider = user.authProvider || 'local';
    if (!user.profilePicture && picture) {
      user.profilePicture = picture;
    }
    await user.save({ validateBeforeSave: false });
  }

  const tokens = await issueAuthSession(user, res, req, isNewUser ? 'auth.google.register.success' : 'auth.google.login.success');

  res.status(isNewUser ? 201 : 200).json({
    status: 'success',
    message: isNewUser ? 'Account created with Google' : 'Logged in with Google',
    data: {
      user: publicUser(user),
      accessToken: tokens.accessToken
    }
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using a valid refresh token.
 */
const refreshToken = catchAsync(async (req, res, next) => {
  const token = getRefreshTokenFromRequest(req);
  if (!token) {
    logSecurityEvent('auth.refresh.missing', req);
    return next(new AppError('Refresh token is required. Please log in again.', 401));
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    clearRefreshCookie(res);
    logSecurityEvent('auth.refresh.failure', req, { reason: err.name });
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 401));
  }

  // Find user and verify stored refresh token
  const user = await User.findById(decoded.id).select('+refreshToken');
  const hashedToken = hashToken(token);
  const matchesCurrentToken = user && (user.refreshToken === hashedToken || user.refreshToken === token);
  if (!matchesCurrentToken) {
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }
    clearRefreshCookie(res);
    logSecurityEvent('auth.refresh.reuse_or_mismatch', req, { subjectUserId: decoded.id });
    return next(new AppError('Invalid refresh token. Please log in again.', 401));
  }

  // Rotate refresh token on every refresh.
  const tokens = generateTokenPair(user._id);
  user.refreshToken = hashToken(tokens.refreshToken);
  await user.save({ validateBeforeSave: false });
  setRefreshCookie(res, tokens.refreshToken);
  logSecurityEvent('auth.refresh.success', req, { subjectUserId: String(user._id) });

  res.status(200).json({
    status: 'success',
    data: {
      accessToken: tokens.accessToken
    }
  });
});

/**
 * POST /api/auth/logout
 * Clear refresh token.
 */
const logout = catchAsync(async (req, res, next) => {
  // Clear refresh token from database
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  clearRefreshCookie(res);
  logSecurityEvent('auth.logout.success', req);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

module.exports = { register, login, googleAuth, refreshToken, logout };
