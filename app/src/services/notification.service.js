/* ═══════════════════════════════════════════
   SkillSwap+ — Notification Service
   Fetch and manage notifications
   ═══════════════════════════════════════════ */

import api from './api.js';

/**
 * Get the current user's notifications.
 * @returns {Array} notifications
 */
export async function getNotifications(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  const qs = params.toString();
  const res = await api.get(`/notifications${qs ? '?' + qs : ''}`);
  if (res.error) return { notifications: [], unreadCount: 0, pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  const payload = res.data?.data;
  if (Array.isArray(payload)) {
    return { notifications: payload, unreadCount: 0, pagination: { page: 1, limit: payload.length, total: payload.length, pages: 1 } };
  }
  return {
    notifications: payload?.notifications || [],
    unreadCount: payload?.unreadCount || 0,
    pagination: payload?.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
  };
}

export async function getUnreadCount() {
  const res = await api.get('/notifications/unread-count');
  if (res.error) return 0;
  return res.data?.data?.unreadCount || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(id) {
  const res = await api.patch(`/notifications/${id}/read`, {});
  return res;
}

/**
 * Mark all notifications as read.
 */
export async function markAllAsRead() {
  const res = await api.patch('/notifications/read-all', {});
  return res;
}

