export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

export const apiUrl = (path) => {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    const body = await response.clone().json().catch(() => ({}));
    const message = String(body.message || '');
    const authExpired = response.status === 401 || message.includes('Invalid or expired token');
    if (authExpired && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  return response;
};
