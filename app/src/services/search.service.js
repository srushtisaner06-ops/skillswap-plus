import api from './api.js';

const cache = new Map();
const MAX_CACHE_SIZE = 25;

export async function globalSearch(query, options = {}) {
  const normalized = String(query || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (normalized.length < 2) {
    return { sessions: [], mentors: [], skills: [] };
  }

  const cacheKey = normalized.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const res = await api.get(`/search?q=${encodeURIComponent(normalized)}`, {
    signal: options.signal
  });

  if (res.error) {
    throw new Error(res.message || 'Search failed');
  }

  const results = res.data?.results || { sessions: [], mentors: [], skills: [] };
  cache.set(cacheKey, results);

  if (cache.size > MAX_CACHE_SIZE) {
    cache.delete(cache.keys().next().value);
  }

  return results;
}
