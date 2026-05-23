const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMyProjectResources,
  createProjectResource,
  updateProjectResource,
  deleteProjectResource
} = require('../controllers/projectResource.controller');

router.use(protect);

router.get('/', getMyProjectResources);
router.post('/', createProjectResource);
router.patch('/:id', updateProjectResource);
router.delete('/:id', deleteProjectResource);

module.exports = router;
