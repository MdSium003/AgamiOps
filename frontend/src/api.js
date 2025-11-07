export const API_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5050';

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const defaults = { credentials: 'include', headers: {} };
  const opts = { ...defaults, ...options, headers: { ...defaults.headers, ...(options.headers || {}) } };
  const response = await fetch(url, opts);
  return response;
}

export function oauthUrl(provider) {
  return `${API_URL}/auth/${provider}`;
}


