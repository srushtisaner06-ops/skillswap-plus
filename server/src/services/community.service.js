const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { NOTIFICATION_TYPE } = require('../utils/constants');
const { createNotification } = require('./notification.service');

const authorSelect = 'name profilePicture rating role badges';

function normalizeTags(tags = []) {
  return [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))].slice(0, 5);
}

function postSort(sort) {
  if (sort === 'top') return { upvoteCount: -1, commentCount: -1, createdAt: -1 };
  return { createdAt: -1 };
}

async function attachUserVotes(items, userId, targetType) {
  if (!userId || items.length === 0) return items;

  const votes = await Vote.find({
    user: userId,
    targetType,
    target: { $in: items.map((item) => item._id) }
  }).select('target').lean();
  const voted = new Set(votes.map((vote) => String(vote.target)));

  return items.map((item) => ({
    ...item,
    hasUpvoted: voted.has(String(item._id))
  }));
}

async function getPosts(query, userId) {
  const { page = 1, limit = 10, category, tag, sort = 'newest' } = query;
  const filter = { isRemoved: false };

  if (category) filter.category = category;
  if (tag) filter.tags = String(tag).trim().toLowerCase();
  if (sort === 'unanswered') filter.commentCount = 0;
  if (sort === 'solved') filter.solvedComment = { $ne: null };

  const skip = (page - 1) * limit;
  const [posts, total, categories] = await Promise.all([
    CommunityPost.find(filter)
      .sort(postSort(sort))
      .skip(skip)
      .limit(limit)
      .populate('author', authorSelect)
      .populate({
        path: 'solvedComment',
        match: { isRemoved: false },
        populate: { path: 'author', select: authorSelect }
      })
      .lean(),
    CommunityPost.countDocuments(filter),
    CommunityPost.aggregate([
      { $match: { isRemoved: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ])
  ]);

  return {
    posts: await attachUserVotes(posts, userId, 'post'),
    categories: categories.map((item) => ({ name: item._id, count: item.count })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async function createPost(userId, data) {
  const post = await CommunityPost.create({
    author: userId,
    title: data.title,
    body: data.body,
    category: data.category,
    tags: normalizeTags(data.tags)
  });

  await User.findByIdAndUpdate(userId, { $inc: { 'stats.communityPosts': 1, xp: 15 } });

  return CommunityPost.findById(post._id)
    .populate('author', authorSelect)
    .lean();
}

async function getComments(postId, query, userId) {
  const { page = 1, limit = 20 } = query;
  const post = await CommunityPost.findOne({ _id: postId, isRemoved: false }).select('_id').lean();
  if (!post) throw new AppError('Community post not found.', 404);

  const skip = (page - 1) * limit;
  const [comments, total] = await Promise.all([
    Comment.find({ post: postId, parentComment: null, isRemoved: false })
      .sort({ isSolution: -1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', authorSelect)
      .lean(),
    Comment.countDocuments({ post: postId, parentComment: null, isRemoved: false })
  ]);

  const parentIds = comments.map((comment) => comment._id);
  const replies = parentIds.length
    ? await Comment.find({ post: postId, parentComment: { $in: parentIds }, isRemoved: false })
      .sort({ createdAt: 1 })
      .populate('author', authorSelect)
      .lean()
    : [];

  const commentsWithVotes = await attachUserVotes(comments, userId, 'comment');
  const repliesWithVotes = await attachUserVotes(replies, userId, 'comment');
  const repliesByParent = repliesWithVotes.reduce((acc, reply) => {
    const key = String(reply.parentComment);
    acc[key] = acc[key] || [];
    acc[key].push(reply);
    return acc;
  }, {});

  return {
    comments: commentsWithVotes.map((comment) => ({
      ...comment,
      replies: repliesByParent[String(comment._id)] || []
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async function createComment(postId, userId, data) {
  const dbSession = await mongoose.startSession();
  let comment;
  let post;
  let parent;

  try {
    await dbSession.withTransaction(async () => {
      post = await CommunityPost.findOne({ _id: postId, isRemoved: false }).session(dbSession);
      if (!post) throw new AppError('Community post not found.', 404);

      const parentComment = data.parentComment || null;
      if (parentComment) {
        parent = await Comment.findOne({ _id: parentComment, post: postId, isRemoved: false }).session(dbSession);
        if (!parent) throw new AppError('Parent comment not found.', 404);
        if (parent.parentComment) throw new AppError('Replies can only be one level deep.', 400);
      }

      comment = await Comment.create(
        [
          {
            post: postId,
            author: userId,
            parentComment,
            body: data.body
          }
        ],
        { session: dbSession }
      ).then(([created]) => created);

      await CommunityPost.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } }, { session: dbSession });
      if (parent) {
        await Comment.findByIdAndUpdate(parent._id, { $inc: { replyCount: 1 } }, { session: dbSession });
      }
      await User.findByIdAndUpdate(userId, { $inc: { xp: 8 } }, { session: dbSession });
    });
  } finally {
    dbSession.endSession();
  }

  const notifyUser = parent?.author || post.author;
  if (String(notifyUser) !== String(userId)) {
    await createNotification(
      notifyUser,
      NOTIFICATION_TYPE.COMMUNITY,
      parent ? 'Someone replied to your community comment.' : `Someone commented on "${post.title}".`,
      'forum',
      'sky',
      '#/community'
    );
  }

  return Comment.findById(comment._id).populate('author', authorSelect).lean();
}

async function toggleVote(targetType, targetId, userId) {
  const Model = targetType === 'post' ? CommunityPost : Comment;
  const targetModel = targetType === 'post' ? 'CommunityPost' : 'Comment';
  const targetFilter = targetType === 'post'
    ? { _id: targetId, isRemoved: false }
    : { _id: targetId, isRemoved: false };

  const target = await Model.findOne(targetFilter).select('_id upvoteCount').lean();
  if (!target) throw new AppError(`${targetType === 'post' ? 'Post' : 'Comment'} not found.`, 404);

  const existing = await Vote.findOne({ user: userId, targetType, target: targetId });
  const increment = existing ? -1 : 1;

  if (existing) {
    await existing.deleteOne();
  } else {
    try {
      await Vote.create({ user: userId, targetType, target: targetId, targetModel, value: 1 });
    } catch (err) {
      if (err.code !== 11000) throw err;
      throw new AppError('Vote already exists.', 409);
    }
  }

  const updated = await Model.findByIdAndUpdate(
    targetId,
    { $inc: { upvoteCount: increment } },
    { returnDocument: 'after' }
  ).select('upvoteCount').lean();

  return {
    hasUpvoted: !existing,
    upvoteCount: Math.max(updated.upvoteCount, 0)
  };
}

async function markSolution(postId, commentId, userId) {
  const dbSession = await mongoose.startSession();
  let post;
  let solved;

  try {
    await dbSession.withTransaction(async () => {
      post = await CommunityPost.findOne({ _id: postId, isRemoved: false }).session(dbSession);
      if (!post) throw new AppError('Community post not found.', 404);
      if (String(post.author) !== String(userId)) {
        throw new AppError('Only the post author can mark a solved answer.', 403);
      }

      solved = await Comment.findOne({
        _id: commentId,
        post: postId,
        parentComment: null,
        isRemoved: false
      }).session(dbSession);
      if (!solved) throw new AppError('Comment not found.', 404);

      await Comment.updateMany({ post: postId, isSolution: true }, { isSolution: false }, { session: dbSession });
      solved.isSolution = true;
      await solved.save({ session: dbSession });

      post.solvedComment = solved._id;
      await post.save({ session: dbSession });
    });
  } finally {
    dbSession.endSession();
  }

  if (String(solved.author) !== String(userId)) {
    await createNotification(
      solved.author,
      NOTIFICATION_TYPE.COMMUNITY,
      'Your community answer was marked as the solution.',
      'check_circle',
      'emerald',
      '#/community'
    );
  }

  return CommunityPost.findById(postId)
    .populate('author', authorSelect)
    .populate({
      path: 'solvedComment',
      populate: { path: 'author', select: authorSelect }
    })
    .lean();
}

async function deletePost(postId, userId) {
  const post = await CommunityPost.findOne({ _id: postId, isRemoved: false });
  if (!post) throw new AppError('Community post not found.', 404);
  if (String(post.author) !== String(userId)) throw new AppError('You can only delete your own posts.', 403);

  post.isRemoved = true;
  post.removedAt = new Date();
  post.removedBy = userId;
  await post.save();

  return post;
}

async function deleteComment(commentId, userId) {
  const comment = await Comment.findOne({ _id: commentId, isRemoved: false });
  if (!comment) throw new AppError('Comment not found.', 404);
  if (String(comment.author) !== String(userId)) throw new AppError('You can only delete your own comments.', 403);

  comment.isRemoved = true;
  comment.removedAt = new Date();
  comment.removedBy = userId;
  await comment.save();

  await CommunityPost.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
  if (comment.parentComment) {
    await Comment.findByIdAndUpdate(comment.parentComment, { $inc: { replyCount: -1 } });
  }

  return comment;
}

module.exports = {
  getPosts,
  createPost,
  getComments,
  createComment,
  toggleVote,
  markSolution,
  deletePost,
  deleteComment
};
