const TOKEN_KEY = 'tutorhub_token';

// Browser-only: the auth token lives in localStorage, so it is never available during server rendering.
export const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY));
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api(path, { method = 'GET', body, params } = {}) {
  const qs = params
    ? '?' +
      new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && !v.length))).toString()
    : '';
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}${qs}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Cannot reach the server. Check your internet connection and try again.', 0);
  }
  const data = await res.json().catch(() => null);
  // A non-JSON 5xx means the request never reached an API route (e.g. the dev server crashed).
  if (!res.ok && !data && res.status >= 500) throw new ApiError('Cannot reach the TutorHub server. Please try again shortly.', res.status);
  if (!res.ok) throw new ApiError(data?.message || 'Request failed', res.status, data?.code);
  return data;
}
