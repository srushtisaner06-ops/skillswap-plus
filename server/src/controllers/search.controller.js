const searchService = require('../services/search.service');
const catchAsync = require('../utils/catchAsync');

const globalSearch = catchAsync(async (req, res) => {
  const results = await searchService.search(req.query.q);

  res.status(200).json({
    success: true,
    results
  });
});

module.exports = { globalSearch };
