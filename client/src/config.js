/**
 * Single source of truth for where the API and Socket.io server live.
 *
 * - Local dev: leave VITE_API_BASE_URL unset. Requests go to the
 *   relative path `/api`, which Vite proxies to localhost:5000
 *   (see vite.config.js), and Socket.io connects to the same origin.
 * - Deployed (client and server on different origins, e.g. server on
 *   Render): set VITE_API_BASE_URL to the server's URL, e.g.
 *   https://your-service.onrender.com
 *
 * The `/api` prefix is appended automatically if you leave it off, so
 * both "https://x.onrender.com" and "https://x.onrender.com/api" work —
 * forgetting the prefix is the easy mistake, and the symptom is a wall
 * of 404s because the server only mounts routes under /api.
 */
function normalizeApiBase(raw) {
  if (!raw) return '/api';
  const trimmed = raw.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export const API_BASE_URL = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

// Socket.io lives at the server's origin root (not under /api). Derive
// it from the API URL when that's absolute; allow an explicit override.
function deriveSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL.trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(API_BASE_URL)) return new URL(API_BASE_URL).origin;
  return '/';
}

export const SOCKET_URL = deriveSocketUrl();

/**
 * Uploaded files are stored as server-relative paths like
 * "/uploads/123-abc.pdf". When the client and server share an origin
 * (dev proxy) that works as-is; on separate origins it must point at
 * the server, otherwise the link resolves against the client's domain.
 */
export function serverFileUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  const origin = /^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : '';
  return `${origin}${path}`;
}
