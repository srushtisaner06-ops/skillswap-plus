/* ═══════════════════════════════════════════
   User Routes
   ═══════════════════════════════════════════ */

const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, getUserById, uploadProfilePicture } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { updateProfileSchema } = require('../validators/user.validator');
const { upload } = require('../middleware/upload');

// Protected routes
router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, validate(updateProfileSchema), updateProfile);
router.post('/profile/avatar', protect, upload.single('avatar'), uploadProfilePicture);

// Public routes
router.get('/:id', getUserById);

module.exports = router;
