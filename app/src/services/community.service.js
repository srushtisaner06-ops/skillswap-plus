import api from './api.js';

function queryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getCommunityPosts(query = {}) {
  const res = await api.get(`/community/posts${queryString(query)}`);
  if (res.error) throw new Error(res.message);
  return res.data?.data || { posts: [], categories: [], pagination: { page: 1, pages: 1, total: 0 } };
}

export async function createCommunityPost(data) {
  const res = await api.post('/community/posts', data);
  if (res.error) throw new Error(res.message);
  return res.data?.data?.post || null;
}

export async function getPostComments(postId, query = {}) {
  const res = await api.get(`/community/posts/${postId}/comments${queryString(query)}`);
  if (res.error) throw new Error(res.message);
  return res.data?.data || { comments: [], pagination: { page: 1, pages: 1, total: 0 } };
}

export async function createPostComment(postId, data) {
  const res = await api.post(`/community/posts/${postId}/comments`, data);
  if (res.error) throw new Error(res.message);
  return res.data?.data?.comment || null;
}

export async function togglePostVote(postId) {
  const res = await api.patch(`/community/posts/${postId}/vote`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data?.vote || null;
}

export async function toggleCommentVote(commentId) {
  const res = await api.patch(`/community/comments/${commentId}/vote`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data?.vote || null;
}

export async function markSolvedAnswer(postId, commentId) {
  const res = await api.patch(`/community/posts/${postId}/solution/${commentId}`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data?.post || null;
}

export async function deleteCommunityPost(postId) {
  const res = await api.delete(`/community/posts/${postId}`);
  if (res.error) throw new Error(res.message);
  return true;
}

export async function deleteCommunityComment(commentId) {
  const res = await api.delete(`/community/comments/${commentId}`);
  if (res.error) throw new Error(res.message);
  return true;
}
