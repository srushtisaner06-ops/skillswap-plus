/* ═══════════════════════════════════════════
   SkillSwap+ — Credit Service
   Balance and transaction history
   ═══════════════════════════════════════════ */

import api from './api.js';

/**
 * Get the current user's credit balance.
 * @returns {Object} { credits }
 */
export async function getCredits() {
  const res = await api.get('/credits');
  if (res.error) return { credits: 0 };
  return res.data?.data || { credits: 0 };
}

/**
 * Get the current user's credit transaction history.
 * @returns {Array} transactions
 */
export async function getTransactions() {
  const res = await api.get('/credits/transactions');
  if (res.error) return [];
  const payload = res.data?.data;
  return payload?.transactions || (Array.isArray(payload) ? payload : []);
}

