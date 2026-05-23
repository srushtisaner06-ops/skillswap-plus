const Resume = require('../models/Resume');
const Activity = require('../models/Activity');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const allowedFields = ['title', 'targetRole', 'fileUrl', 'summary', 'skills', 'score', 'status', 'isPrimary', 'lastReviewedAt', 'feedback'];

function pickAllowed(body) {
  return allowedFields.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});
}

const getMyResumes = catchAsync(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id })
    .sort({ isPrimary: -1, updatedAt: -1 })
    .limit(Math.min(parseInt(req.query.limit, 10) || 10, 25))
    .lean();

  res.status(200).json({ status: 'success', data: { resumes } });
});

const createResume = catchAsync(async (req, res) => {
  const duplicate = await Resume.findOne({
    user: req.user._id,
    title: req.body.title,
    targetRole: req.body.targetRole || ''
  });
  if (duplicate) {
    return res.status(200).json({ status: 'success', data: { resume: duplicate } });
  }

  const payload = pickAllowed(req.body);
  if (payload.isPrimary) {
    await Resume.updateMany({ user: req.user._id }, { isPrimary: false });
  }

  const resume = await Resume.create({ ...payload, user: req.user._id });

  await Activity.create({
    user: req.user._id,
    type: 'resume',
    title: 'Resume saved',
    message: `${resume.title} is now available in your profile workspace.`,
    icon: 'description',
    color: 'emerald',
    link: '#/profile',
    metadata: { resumeId: resume._id }
  });

  res.status(201).json({ status: 'success', data: { resume } });
});

const updateResume = catchAsync(async (req, res, next) => {
  const payload = pickAllowed(req.body);
  if (payload.isPrimary) {
    await Resume.updateMany({ user: req.user._id, _id: { $ne: req.params.id } }, { isPrimary: false });
  }

  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    payload,
    { new: true, runValidators: true }
  );

  if (!resume) return next(new AppError('Resume not found.', 404));
  res.status(200).json({ status: 'success', data: { resume } });
});

const deleteResume = catchAsync(async (req, res, next) => {
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));
  res.status(204).json({ status: 'success', data: null });
});

module.exports = {
  getMyResumes,
  createResume,
  updateResume,
  deleteResume
};
