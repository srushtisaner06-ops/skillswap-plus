/* ═══════════════════════════════════════════
   User Controller
   ═══════════════════════════════════════════ */

const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const env = require('../config/env');
const { allowedTypes } = require('../middleware/upload');
const { logSecurityEvent } = require('../utils/security');

function hasValidImageSignature(file) {
  const buffer = file.buffer;
  if (!buffer || buffer.length < 12) return false;

  if (file.mimetype === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  }

  if (file.mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (file.mimetype === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }

  return false;
}

async function saveAvatarFile(file, userId) {
  const ext = allowedTypes.get(file.mimetype);
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  const fileName = `user-${userId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const filePath = path.join(uploadDir, fileName);

  if (!filePath.startsWith(`${uploadDir}${path.sep}`)) {
    throw new AppError('Invalid upload path.', 400);
  }

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o600 });
  return fileName;
}

/**
 * GET /api/users/profile
 * Get the current authenticated user's full profile.
 */
const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

/**
 * PUT /api/users/profile
 * Update the current user's profile.
 */
const updateProfile = catchAsync(async (req, res, next) => {
  const allowedFields = ['name', 'bio', 'skillsOffered', 'skillsWanted', 'profilePicture'];

  // Build update object from allowed fields only
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * GET /api/users/:id
 * Get a user's public profile by ID.
 */
const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('name bio skillsOffered skillsWanted rating ratingCount profilePicture role createdAt');

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

/**
 * POST /api/users/profile/avatar
 * Upload a profile picture.
 */
const uploadProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file.', 400));
  }

  if (!hasValidImageSignature(req.file)) {
    logSecurityEvent('upload.rejected', req, {
      reason: 'signature-mismatch',
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    return next(new AppError('Invalid image file.', 400));
  }

  const fileName = await saveAvatarFile(req.file, req.user._id);
  logSecurityEvent('upload.accepted', req, {
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  // Build the URL path
  const pictureUrl = `/uploads/${fileName}`;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePicture: pictureUrl },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Profile picture updated',
    data: {
      profilePicture: user.profilePicture
    }
  });
});

module.exports = { getProfile, updateProfile, getUserById, uploadProfilePicture };
