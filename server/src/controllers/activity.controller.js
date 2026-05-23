const Activity = require('../models/Activity');
const catchAsync = require('../utils/catchAsync');

const getMyActivity = catchAsync(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const activities = await Activity.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(req.query.limit, 10) || 20, 50))
    .lean();

  res.status(200).json({ status: 'success', data: { activities } });
});

module.exports = { getMyActivity };
