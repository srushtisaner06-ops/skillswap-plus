const express = require('express');
const Joi = require('joi');

const { globalSearch } = require('../controllers/search.controller');
const { validateQuery } = require('../middleware/validate');

const router = express.Router();

const searchQuerySchema = Joi.object({
  q: Joi.string().trim().max(60).allow('').default('')
});

router.get('/', validateQuery(searchQuerySchema), globalSearch);

module.exports = router;
