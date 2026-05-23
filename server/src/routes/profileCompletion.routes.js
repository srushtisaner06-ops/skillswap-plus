const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyProfileCompletion } = require('../controllers/profileCompletion.controller');

router.use(protect);

router.get('/', getMyProfileCompletion);

module.exports = router;
