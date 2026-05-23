/* ═══════════════════════════════════════════
   SkillSwap+ — User Service
   Profile fetching and updating
   ═══════════════════════════════════════════ */

import api from './api.js';

/**
 * Get the authenticated user's full profile.
 * @returns {Object} user object
 */
export async function getProfile() {
  const res = await api.get('/users/profile');
  if (res.error) return null;
  return res.data?.data?.user || null;
}

/**
 * Update the authenticated user's profile.
 * @param {Object} data — { name, bio, skillsOffered, skillsWanted }
 * @returns {Object} updated user object
 */
export async function updateProfile(data) {
  const res = await api.put('/users/profile', data);
  if (res.error) throw new Error(res.message);
  return res.data?.data?.user || null;
}

/**
 * Get a user's public profile by ID.
 * @param {string} id
 * @returns {Object} user object (public fields)
 */
export async function getUserById(id) {
  const res = await api.get(`/users/${id}`);
  if (res.error) return null;
  return res.data?.data?.user || null;
}
