/* ═══════════════════════════════════════════
   SkillSwap+ — Data Abstraction Layer
   
   ALL data access flows through this module.
   Delegates to real API services.
   
   This is the ONLY file pages should import
   for data operations.
   ═══════════════════════════════════════════ */

import { store } from '../state.js';

// ─── Standardized Response Shape ─────────────
// Every method returns: { data, error, message }
function ok(data) {
  return { data, error: false, message: 'Success' };
}
function fail(message) {
  return { data: null, error: true, message };
}

// ═══════════════════════════════════════════
//  USER / PROFILE
// ═══════════════════════════════════════════

export async function fetchProfile() {
  try {
    const { getProfile } = await import('./user.service.js');
    const user = await getProfile();
    if (user) {
      store.setUserFromAPI(user);
      return ok(user);
    }
    return fail('Failed to load profile');
  } catch (e) {
    return fail(e.message || 'Profile fetch error');
  }
}

export async function saveProfile(data) {
  try {
    const { updateProfile } = await import('./user.service.js');
    const updated = await updateProfile(data);
    if (updated) {
      store.setUserFromAPI(updated);
      return ok(updated);
    }
    return fail('Failed to update profile');
  } catch (e) {
    return fail(e.message || 'Profile update error');
  }
}

// ═══════════════════════════════════════════
//  SESSIONS
// ═══════════════════════════════════════════

export async function fetchMySessions() {
  try {
    const { getMySessions } = await import('./session.service.js');
    const result = await getMySessions();
    return ok(result || { hosting: [], attending: [] });
  } catch (e) {
    return fail(e.message || 'Sessions fetch error');
  }
}

export async function fetchMyBookings() {
  try {
    const { getMyBookings } = await import('./booking.service.js');
    return ok(await getMyBookings());
  } catch (e) {
    return fail(e.message || 'Bookings fetch error');
  }
}

// ═══════════════════════════════════════════
//  CREDITS / TRANSACTIONS
// ═══════════════════════════════════════════

export async function fetchTransactions() {
  try {
    const { getTransactions } = await import('./credit.service.js');
    const transactions = await getTransactions();
    return ok(transactions || []);
  } catch (e) {
    return fail(e.message || 'Transactions fetch error');
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  PRESENTATION FEATURES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function fetchDashboardAnalytics() {
  try {
    const { getDashboardAnalytics } = await import('./platform.service.js');
    return ok(await getDashboardAnalytics());
  } catch (e) {
    return fail(e.message || 'Analytics fetch error');
  }
}

export async function fetchProjects(query = {}) {
  try {
    const { getProjects } = await import('./platform.service.js');
    return ok(await getProjects(query));
  } catch (e) {
    return fail(e.message || 'Projects fetch error');
  }
}

export async function fetchResumes() {
  try {
    const { getResumes } = await import('./platform.service.js');
    return ok(await getResumes());
  } catch (e) {
    return fail(e.message || 'Resumes fetch error');
  }
}

export async function fetchRecommendations(query = {}) {
  try {
    const { getRecommendations } = await import('./platform.service.js');
    return ok(await getRecommendations(query));
  } catch (e) {
    return fail(e.message || 'Recommendations fetch error');
  }
}

export async function fetchActivity(query = {}) {
  try {
    const { getActivity } = await import('./platform.service.js');
    return ok(await getActivity(query));
  } catch (e) {
    return fail(e.message || 'Activity fetch error');
  }
}

export async function fetchProfileCompletion() {
  try {
    const { getProfileCompletion } = await import('./platform.service.js');
    return ok(await getProfileCompletion());
  } catch (e) {
    return fail(e.message || 'Profile completion fetch error');
  }
}

// ═══════════════════════════════════════════
//  REFERRALS
// ═══════════════════════════════════════════

const REFERRAL_STORAGE_KEY = 'skillswap_referrals';

function _loadReferrals() {
  try {
    return JSON.parse(localStorage.getItem(REFERRAL_STORAGE_KEY)) || { referrals: [], totalRewards: 0 };
  } catch { return { referrals: [], totalRewards: 0 }; }
}

function _saveReferrals(data) {
  localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(data));
}

export function getReferralCode() {
  const user = store.getUserSafe();
  const id = user._id || 'user';
  return 'SKILL-' + id.slice(-6).toUpperCase();
}

export function getReferralStats() {
  const data = _loadReferrals();
  return ok({
    code: getReferralCode(),
    count: data.referrals.length,
    totalRewards: data.totalRewards,
    referrals: data.referrals
  });
}

export function simulateReferral(name) {
  const data = _loadReferrals();
  const reward = 25;
  data.referrals.push({
    id: 'ref-' + Date.now(),
    name: name || 'Anonymous User',
    date: new Date().toISOString(),
    reward,
    status: 'completed'
  });
  data.totalRewards += reward;
  _saveReferrals(data);
  store.addCredits(reward, `Referral: ${name}`);
  return ok({ reward, newBalance: store.get('credits') });
}

// ═══════════════════════════════════════════
//  AUTH (thin pass-through, keeps existing logic)
// ═══════════════════════════════════════════

export async function performLogin(email, password) {
  try {
    const { login } = await import('./auth.service.js');
    return await login(email, password);
  } catch (e) {
    return fail(e.message || 'Login failed');
  }
}

export async function performRegister(name, email, password) {
  try {
    const { register } = await import('./auth.service.js');
    return await register(name, email, password);
  } catch (e) {
    return fail(e.message || 'Registration failed');
  }
}

export async function performGoogleLogin(credential) {
  try {
    const { googleLogin } = await import('./auth.service.js');
    return await googleLogin(credential);
  } catch (e) {
    return fail(e.message || 'Google login failed');
  }
}

export async function performLogout() {
  const { logout } = await import('./auth.service.js');
  return await logout();
}
