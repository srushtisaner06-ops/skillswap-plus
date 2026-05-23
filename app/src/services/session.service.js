/* ═══════════════════════════════════════════
   SkillSwap+ — Session Service
   Sessions CRUD, join requests, and completion
   ═══════════════════════════════════════════ */

import api from './api.js';

/**
 * Create a new session (as host/teacher).
 * @param {Object} data — { title, description, skillCategory, date, startTime, endTime, creditsRequired, maxParticipants, tags }
 */
export async function createSession(data) {
  const res = await api.post('/sessions', data);
  if (res.error) throw new Error(res.message);
  return res.data?.data?.session || null;
}

/**
 * Browse available sessions with optional filters.
 * @param {Object} query — { skillCategory, status, page, limit }
 */
export async function getSessions(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  const qs = params.toString();
  const res = await api.get(`/sessions${qs ? '?' + qs : ''}`);
  if (res.error) return { sessions: [], total: 0, page: 1, pages: 1 };
  return res.data?.data || { sessions: [], total: 0, page: 1, pages: 1 };
}

/**
 * Get sessions the current user is hosting or attending.
 * @returns {{ hosting: [], attending: [] }}
 */
export async function getMySessions() {
  const res = await api.get('/sessions/mine');
  if (res.error) return { hosting: [], attending: [] };
  return res.data?.data || { hosting: [], attending: [] };
}

/**
 * Get a single session by ID.
 */
export async function getSessionById(id) {
  const res = await api.get(`/sessions/${id}`);
  if (res.error) return null;
  return res.data?.data?.session || null;
}

/**
 * Request to join a session (as learner).
 */
export async function requestToJoin(id) {
  const res = await api.post(`/sessions/${id}/request`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data || res.data;
}

/**
 * Respond to a join request (accept/reject) — host only.
 * @param {string} sessionId
 * @param {string} userId
 * @param {'accept'|'reject'} action
 */
export async function respondToRequest(sessionId, userId, action) {
  const res = await api.post(`/sessions/${sessionId}/respond`, { userId, action });
  if (res.error) throw new Error(res.message);
  return res.data?.data || res.data;
}

/**
 * Mark a session as completed — host only.
 */
export async function completeSession(id) {
  const res = await api.patch(`/sessions/${id}/complete`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data || res.data;
}

