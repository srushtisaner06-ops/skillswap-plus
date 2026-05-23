const communityService = require('../services/community.service');
const catchAsync = require('../utils/catchAsync');

const getPosts = catchAsync(async (req, res) => {
  const result = await communityService.getPosts(req.query, req.user?._id);

  res.status(200).json({
    status: 'success',
    data: result
  });
});

const createPost = catchAsync(async (req, res) => {
  const post = await communityService.createPost(req.user._id, req.body);

  res.status(201).json({
    status: 'success',
    data: { post }
  });
});

const getComments = catchAsync(async (req, res) => {
  const result = await communityService.getComments(req.params.postId, req.query, req.user?._id);

  res.status(200).json({
    status: 'success',
    data: result
  });
});

const createComment = catchAsync(async (req, res) => {
  const comment = await communityService.createComment(req.params.postId, req.user._id, req.body);

  res.status(201).json({
    status: 'success',
    data: { comment }
  });
});

const votePost = catchAsync(async (req, res) => {
  const vote = await communityService.toggleVote('post', req.params.id, req.user._id);

  res.status(200).json({
    status: 'success',
    data: { vote }
  });
});

const voteComment = catchAsync(async (req, res) => {
  const vote = await communityService.toggleVote('comment', req.params.id, req.user._id);

  res.status(200).json({
    status: 'success',
    data: { vote }
  });
});

const markSolution = catchAsync(async (req, res) => {
  const post = await communityService.markSolution(req.params.postId, req.params.commentId, req.user._id);

  res.status(200).json({
    status: 'success',
    data: { post }
  });
});

const deletePost = catchAsync(async (req, res) => {
  await communityService.deletePost(req.params.id, req.user._id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

const deleteComment = catchAsync(async (req, res) => {
  await communityService.deleteComment(req.params.id, req.user._id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = {
  getPosts,
  createPost,
  getComments,
  createComment,
  votePost,
  voteComment,
  markSolution,
  deletePost,
  deleteComment
};
