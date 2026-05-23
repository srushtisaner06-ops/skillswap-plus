/* ═══════════════════════════════════════════
   SkillSwap+ — API Service Layer
   Reusable fetch wrapper with auth & error handling
   ═══════════════════════════════════════════ */

const configuredApiBase = import.meta.env?.VITE_API_URL?.trim();
const API_BASE = (configuredApiBase || '/api').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15000;

function createRequestSignal(externalSignal) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort(new DOMException('Request timed out', 'TimeoutError'));
  }, REQUEST_TIMEOUT_MS);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true });
    }
  }

  return { signal: controller.signal, timeoutId };
}

/**
 * Core fetch wrapper.
 * - Attaches Authorization header if token exists
 * - Parses JSON responses
 * - Handles 401 → auto logout + redirect
 * - Throws enriched errors with server messages
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const { signal, timeoutId } = createRequestSignal(options.signal);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Attach Bearer token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
    signal
  };

  // If body is an object, stringify it
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    let response = await fetch(`${API_BASE}${endpoint}`, config);

    // Handle 401 — token expired or invalid
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({}),
          signal
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json().catch(() => null);
          const accessToken = refreshData?.data?.accessToken;
          if (accessToken) {
            localStorage.setItem('token', accessToken);
            config.headers.Authorization = `Bearer ${accessToken}`;
            response = await fetch(`${API_BASE}${endpoint}`, config);
          }
        }
      } catch (refreshError) {
        if (refreshError?.name === 'AbortError') throw refreshError;
        console.warn('[API] Token refresh failed:', refreshError);
      }
    }

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.hash = '/';
      return { data: null, error: true, status: 401, message: 'Session expired. Please log in again.' };
    }

    // Parse response body
    const data = await response.json().catch(() => null);

    // Handle non-success responses
    if (!response.ok) {
      const message = data?.message || data?.error || `Request failed (${response.status})`;
      console.warn(`[API] Expected error on ${endpoint}:`, message);
      return { data: null, error: true, status: response.status, message };
    }

    // Return safely structured success
    return { data, error: false, status: response.status, message: 'Success' };
  } catch (error) {
    if (error?.name === 'AbortError' && options.signal?.aborted) {
      throw error;
    }
    const message = error?.name === 'AbortError' || error?.name === 'TimeoutError'
      ? 'Request timed out. Please try again.'
      : 'Network error. Please check your connection.';
    console.error(`[API] Fatal Network Error on ${endpoint}:`, error);
    // Return absolutely safe null object on complete network failure
    return { data: null, error: true, status: 0, message };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Custom error class with status code and server data
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/* ─── Convenience Methods ────────────────── */

const api = {
  get: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'DELETE' })
};

export { api, apiFetch, ApiError };
export default api;
