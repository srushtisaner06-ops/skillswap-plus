const Joi = require('joi');
const { COMMUNITY_CATEGORIES } = require('../models/CommunityPost');

const objectId = Joi.string().hex().length(24).messages({
  'string.hex': 'Invalid ID format',
  'string.length': 'Invalid ID format'
});

const tag = Joi.string().trim().lowercase().min(1).max(24);

const postQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(30).default(10),
  category: Joi.string().valid(...COMMUNITY_CATEGORIES).allow(''),
  tag: tag.allow(''),
  sort: Joi.string().valid('newest', 'top', 'unanswered', 'solved').default('newest')
});

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(5).max(140).required(),
  body: Joi.string().trim().min(10).max(3000).required(),
  category: Joi.string().valid(...COMMUNITY_CATEGORIES).default('General Discussion'),
  tags: Joi.array().items(tag).max(5).default([])
});

const commentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const createCommentSchema = Joi.object({
  body: Joi.string().trim().min(2).max(1500).required(),
  parentComment: objectId.allow(null, '')
});

const idParamSchema = Joi.object({
  id: objectId.required()
});

const postIdParamSchema = Joi.object({
  postId: objectId.required()
});

const solutionParamSchema = Joi.object({
  postId: objectId.required(),
  commentId: objectId.required()
});

module.exports = {
  postQuerySchema,
  createPostSchema,
  commentQuerySchema,
  createCommentSchema,
  idParamSchema,
  postIdParamSchema,
  solutionParamSchema
};
