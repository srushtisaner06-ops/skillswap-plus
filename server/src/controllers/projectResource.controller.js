const ProjectResource = require('../models/ProjectResource');
const Activity = require('../models/Activity');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const allowedFields = ['title', 'description', 'type', 'category', 'url', 'skills', 'status', 'visibility', 'metrics'];

function pickAllowed(body) {
  return allowedFields.reduce((acc, field) => {
    if (body[field] !== undefined) acc[field] = body[field];
    return acc;
  }, {});
}

const getMyProjectResources = catchAsync(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const items = await ProjectResource.find(filter)
    .sort({ updatedAt: -1 })
    .limit(Math.min(parseInt(req.query.limit, 10) || 20, 50))
    .lean();

  res.status(200).json({ status: 'success', data: { items } });
});

const createProjectResource = catchAsync(async (req, res) => {
  const duplicate = await ProjectResource.findOne({
    user: req.user._id,
    type: req.body.type || 'project',
    title: req.body.title
  });
  if (duplicate) {
    return res.status(200).json({ status: 'success', data: { item: duplicate } });
  }

  const item = await ProjectResource.create({
    ...pickAllowed(req.body),
    user: req.user._id
  });

  await Activity.create({
    user: req.user._id,
    type: item.type === 'resource' ? 'project' : 'project',
    title: item.type === 'resource' ? 'Resource added' : 'Project added',
    message: `${item.title} was added to your ${item.type === 'resource' ? 'resources' : 'project'} portfolio.`,
    icon: item.type === 'resource' ? 'library_books' : 'work',
    color: 'sky',
    link: '#/profile',
    metadata: { projectResourceId: item._id, type: item.type }
  });

  res.status(201).json({ status: 'success', data: { item } });
});

const updateProjectResource = catchAsync(async (req, res, next) => {
  const item = await ProjectResource.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    pickAllowed(req.body),
    { new: true, runValidators: true }
  );

  if (!item) return next(new AppError('Project/resource not found.', 404));
  res.status(200).json({ status: 'success', data: { item } });
});

const deleteProjectResource = catchAsync(async (req, res, next) => {
  const item = await ProjectResource.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) return next(new AppError('Project/resource not found.', 404));
  res.status(204).json({ status: 'success', data: null });
});

module.exports = {
  getMyProjectResources,
  createProjectResource,
  updateProjectResource,
  deleteProjectResource
};
