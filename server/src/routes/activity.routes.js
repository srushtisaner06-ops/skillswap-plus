const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyActivity } = require('../controllers/activity.controller');

router.use(protect);

router.get('/', getMyActivity);

module.exports = router;
