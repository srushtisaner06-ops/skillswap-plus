import api from './api.js';

export async function getDashboardAnalytics() {
  const res = await api.get('/analytics/dashboard');
  if (res.error) return null;
  return res.data?.data || null;
}

export async function getProjects(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.append(key, value);
  });
  const qs = params.toString();
  const res = await api.get(`/projects${qs ? '?' + qs : ''}`);
  if (res.error) return [];
  return res.data?.data?.items || [];
}

export async function createProject(data) {
  const res = await api.post('/projects', data);
  if (res.error) throw new Error(res.message);
  return res.data?.data?.item || null;
}

export async function getResumes() {
  const res = await api.get('/resumes');
  if (res.error) return [];
  return res.data?.data?.resumes || [];
}

export async function createResume(data) {
  const res = await api.post('/resumes', data);
  if (res.error) throw new Error(res.message);
  return res.data?.data?.resume || null;
}

export async function getRecommendations(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.append(key, value);
  });
  const qs = params.toString();
  const res = await api.get(`/recommendations${qs ? '?' + qs : ''}`);
  if (res.error) return [];
  return res.data?.data?.recommendations || [];
}

export async function updateRecommendation(id, data) {
  const res = await api.patch(`/recommendations/${id}`, data);
  if (res.error) throw new Error(res.message);
  return res.data?.data?.recommendation || null;
}

export async function getActivity(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.append(key, value);
  });
  const qs = params.toString();
  const res = await api.get(`/activity${qs ? '?' + qs : ''}`);
  if (res.error) return [];
  return res.data?.data?.activities || [];
}

export async function getProfileCompletion() {
  const res = await api.get('/profile-completion');
  if (res.error) return null;
  return res.data?.data?.completion || null;
}
