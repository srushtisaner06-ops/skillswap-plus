const multer = require('multer');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
]);

const fileFilter = (req, file, cb) => {
  if (allowedTypes.has(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new AppError('Only .jpg, .png, and .webp images are allowed.', 400), false);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: env.UPLOAD_MAX_BYTES,
    files: 1
  }
});

module.exports = { upload, allowedTypes };
