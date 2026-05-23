const express = require('express');
const router = express.Router();

const {
  getPosts,
  createPost,
  getComments,
  createComment,
  votePost,
  voteComment,
  markSolution,
  deletePost,
  deleteComment
} = require('../controllers/community.controller');
const { protect } = require('../middleware/auth');
const { validate, validateParams, validateQuery } = require('../middleware/validate');
const {
  postQuerySchema,
  createPostSchema,
  commentQuerySchema,
  createCommentSchema,
  idParamSchema,
  postIdParamSchema,
  solutionParamSchema
} = require('../validators/community.validator');

router.use(protect);

router
  .route('/posts')
  .get(validateQuery(postQuerySchema), getPosts)
  .post(validate(createPostSchema), createPost);

router
  .route('/posts/:postId/comments')
  .get(validateParams(postIdParamSchema), validateQuery(commentQuerySchema), getComments)
  .post(validateParams(postIdParamSchema), validate(createCommentSchema), createComment);

router.patch('/posts/:id/vote', validateParams(idParamSchema), votePost);
router.delete('/posts/:id', validateParams(idParamSchema), deletePost);
router.patch('/comments/:id/vote', validateParams(idParamSchema), voteComment);
router.delete('/comments/:id', validateParams(idParamSchema), deleteComment);
router.patch('/posts/:postId/solution/:commentId', validateParams(solutionParamSchema), markSolution);

module.exports = router;
