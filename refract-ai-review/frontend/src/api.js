const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the Refract API. Start the Python backend and try again.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload.detail === 'string'
      ? payload.detail
      : payload.detail?.message || payload.message;
    throw new Error(detail || `Request failed (${response.status}).`);
  }
  return payload;
}

export const api = {
  health: () => request('/api/health'),
  review: (payload) => request('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  history: () => request('/api/reviews'),
  reviewById: (id) => request(`/api/reviews/${encodeURIComponent(id)}`),
};
