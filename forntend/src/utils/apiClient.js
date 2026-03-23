/**
 * Shared API client with retry logic and connection resilience.
 * Use this for all backend calls so the app recovers when the backend is briefly unavailable.
 */
import sessionManager from './sessionManager';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

// Same as Vite proxy: no API_BASE = use relative /api (proxy forwards to VITE_BACKEND_PORT)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}`
  : '';

export function getApiBase() {
  return API_BASE;
}

export function buildApiUrl(endpoint) {
  const path = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  if (!API_BASE) return path;
  const base = API_BASE.replace(/\/api\/?$/, '');
  return `${base}/api${path.replace(/^\/api/, '')}`;
}

function getAuthHeaders(extraHeaders = {}) {
  const token =
    (sessionManager && sessionManager.getToken && sessionManager.getToken()) ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('firebaseToken') ||
    localStorage.getItem('adminToken');
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function isNetworkError(err) {
  return (
    err?.name === 'TypeError' &&
    (err?.message === 'Failed to fetch' || err?.message?.includes('fetch'))
  );
}

/**
 * Fetch with automatic retry on network failure (e.g. backend restarted, connection lost).
 * Retries up to MAX_RETRIES times with RETRY_DELAY_MS between attempts.
 */
export async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  const doFetch = async () => {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.response = res;
      throw err;
    }
    return res;
  };

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await doFetch();
      return response;
    } catch (err) {
      lastError = err;
      const isRetryable = isNetworkError(err) || err?.status >= 502 || err?.status === 408;
      if (!isRetryable) throw err;
      if (attempt === retries) {
        if (isNetworkError(err)) {
          throw new Error('Cannot reach the server. Please ensure the backend is running and try again.');
        }
        throw err;
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw lastError;
}

/**
 * JSON API call with retry. Use for GET/POST/PATCH etc. with JSON body.
 */
export async function apiCall(endpoint, options = {}) {
  const url = buildApiUrl(endpoint);
  const headers = getAuthHeaders(options.headers || {});
  const res = await fetchWithRetry(url, { ...options, headers });
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON from server');
  }
}

/**
 * API call for FormData (e.g. file upload). No Content-Type header; browser sets multipart.
 */
export async function apiCallFormData(endpoint, formData) {
  const url = buildApiUrl(endpoint);
  const token =
    (sessionManager && sessionManager.getToken && sessionManager.getToken()) ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('firebaseToken') ||
    localStorage.getItem('adminToken');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetchWithRetry(url, { method: 'POST', body: formData, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON from server');
  }
}

/**
 * Ping backend to check if it's reachable. Use for connection status UI.
 */
export async function pingBackend() {
  const url = buildApiUrl('/ping');
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Axios-style default export for services that use apiClient.get/put/post.
 * Uses fetchWithRetry under the hood so all requests benefit from retries.
 */
async function request(method, url, data, config = {}) {
  const path = url.startsWith('/api') ? url : buildApiUrl(url);
  const isFormData = data instanceof FormData;
  const headers = getAuthHeaders(config.headers || {});
  if (isFormData) delete headers['Content-Type'];
  const opts = { method, headers };
  if (data !== undefined && data !== null && method !== 'GET') {
    opts.body = isFormData ? data : JSON.stringify(data);
  }
  const query = config.params ? '?' + new URLSearchParams(config.params).toString() : '';
  const res = await fetchWithRetry(path + query, opts);
  const text = await res.text();
  const out = { data: null, status: res.status };
  if (text) {
    try {
      out.data = JSON.parse(text);
    } catch {
      out.data = text;
    }
  }
  return out;
}

const defaultExport = {
  get: (url, config) => request('GET', url, null, config),
  post: (url, data, config) => request('POST', url, data, config),
  put: (url, data, config) => request('PUT', url, data, config),
  patch: (url, data, config) => request('PATCH', url, data, config),
  delete: (url, config) => request('DELETE', url, null, config),
};

export default defaultExport;
