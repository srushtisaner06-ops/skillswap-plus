/* ═══════════════════════════════════════════
   Auth Routes
   ═══════════════════════════════════════════ */

const express = require('express');
const router = express.Router();

const { register, login, googleAuth, refreshToken, logout } = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// Public routes (with auth rate limiter)
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login',    authLimiter, validate(loginSchema),    login);
router.post('/google',   authLimiter,                           googleAuth);
router.post('/refresh',                                      refreshToken);

// Protected routes
router.post('/logout', protect, logout);

module.exports = router;
