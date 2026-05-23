const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyResumes,
  createResume,
  updateResume,
  deleteResume
} = require('../controllers/resume.controller');

router.use(protect);

router.get('/', getMyResumes);
router.post('/', createResume);
router.patch('/:id', updateResume);
router.delete('/:id', deleteResume);

module.exports = router;
