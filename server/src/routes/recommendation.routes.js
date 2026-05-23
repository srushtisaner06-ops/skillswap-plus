const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyRecommendations,
  createRecommendation,
  updateRecommendation
} = require('../controllers/recommendation.controller');

router.use(protect);

router.get('/', getMyRecommendations);
router.post('/', createRecommendation);
router.patch('/:id', updateRecommendation);

module.exports = router;
