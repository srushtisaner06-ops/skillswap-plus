const Recommendation = require('../models/Recommendation');
const Activity = require('../models/Activity');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const allowedFields = ['title', 'category', 'reason', 'detail', 'sourceType', 'targetUrl', 'credits', 'status', 'priority', 'relatedSkills'];

function pickAllowed(body) {
  return allowedFields.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});
}

const getMyRecommendations = catchAsync(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const recommendations = await Recommendation.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .limit(Math.min(parseInt(req.query.limit, 10) || 10, 25))
    .lean();

  res.status(200).json({ status: 'success', data: { recommendations } });
});

const createRecommendation = catchAsync(async (req, res) => {
  const duplicate = await Recommendation.findOne({
    user: req.user._id,
    title: req.body.title,
    sourceType: req.body.sourceType || 'system',
    status: { $ne: 'dismissed' }
  });
  if (duplicate) {
    return res.status(200).json({ status: 'success', data: { recommendation: duplicate } });
  }

  const recommendation = await Recommendation.create({
    ...pickAllowed(req.body),
    user: req.user._id
  });

  await Activity.create({
    user: req.user._id,
    type: 'recommendation',
    title: 'New recommendation',
    message: recommendation.title,
    icon: 'auto_awesome',
    color: 'violet',
    link: recommendation.targetUrl,
    metadata: { recommendationId: recommendation._id }
  });

  res.status(201).json({ status: 'success', data: { recommendation } });
});

const updateRecommendation = catchAsync(async (req, res, next) => {
  const recommendation = await Recommendation.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    pickAllowed(req.body),
    { new: true, runValidators: true }
  );

  if (!recommendation) return next(new AppError('Recommendation not found.', 404));
  res.status(200).json({ status: 'success', data: { recommendation } });
});

module.exports = {
  getMyRecommendations,
  createRecommendation,
  updateRecommendation
};
