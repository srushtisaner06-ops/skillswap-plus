const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardAnalytics } = require('../controllers/analytics.controller');

router.use(protect);

router.get('/dashboard', getDashboardAnalytics);

module.exports = router;
