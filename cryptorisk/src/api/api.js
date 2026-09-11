/**
 * api.js — Centralised API client
 *
 * All requests go through here. The base URL comes from VITE_API_URL in .env.
 * The JWT access token is read from localStorage and attached to every request.
 * On 401, we clear auth and redirect to /login.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Token helpers ─────────────────────────────────────────────────────────────

export const token = {
  get: ()      => localStorage.getItem('cr_access_token'),
  set: (t)     => localStorage.setItem('cr_access_token', t),
  clear: ()    => localStorage.removeItem('cr_access_token'),
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token.get();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',          // send httpOnly refresh-token cookie
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 → force re-login
  if (res.status === 401) {
    token.clear();
    window.location.href = '/login';
    return;
  }

  if (res.status === 204) return null; // no body

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const get    = (path)       => request('GET',    path);
const post   = (path, body) => request('POST',   path, body);
const put    = (path, body) => request('PUT',    path, body);
const patch  = (path, body) => request('PATCH',  path, body);
const del    = (path)       => request('DELETE', path);

// ── Auth endpoints ────────────────────────────────────────────────────────────

export const auth = {
  login:    (email, password)       => post('/api/auth/login',    { email, password }),
  register: (name, email, password) => post('/api/auth/register', { name, email, password }),
  logout:   ()                      => post('/api/auth/logout'),
  refresh:  ()                      => post('/api/auth/refresh'),
};

// ── Portfolio endpoints ───────────────────────────────────────────────────────

export const portfolio = {
  list:       ()               => get('/api/portfolio'),
  create:     (name)           => post('/api/portfolio', { name }),
  get:        (id)             => get(`/api/portfolio/${id}`),
  update:     (id, name)       => put(`/api/portfolio/${id}`, { name }),
  delete:     (id)             => del(`/api/portfolio/${id}`),

  // Holdings
  addHolding:    (id, coinId, quantity) => post(`/api/portfolio/${id}/holdings`, { coinId, quantity }),
  updateHolding: (id, hId, quantity)   => put(`/api/portfolio/${id}/holdings/${hId}`, { quantity }),
  deleteHolding: (id, hId)             => del(`/api/portfolio/${id}/holdings/${hId}`),

  // Analytics
  summary:     (id) => get(`/api/portfolio/${id}/summary`),
  risk:        (id) => get(`/api/portfolio/${id}/risk`),
  correlation: (id) => get(`/api/portfolio/${id}/correlation`),
};

// ── Coins endpoints ───────────────────────────────────────────────────────────

export const coins = {
  list:    ()       => get('/api/coins'),
  history: (coinId) => get(`/api/coins/${coinId}/history`),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────

export const admin = {
  users:      ()               => get('/api/admin/users'),
  stats:      ()               => get('/api/admin/stats'),
  updateRole: (id, role)       => patch(`/api/admin/users/${id}/role`, { role }),
  deleteUser: (id)             => del(`/api/admin/users/${id}`),
};
