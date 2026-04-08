export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function resolveAssetUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  try {
    return new URL(url, API_URL.replace(/\/api\/v1\/?$/, '/')).toString();
  } catch {
    return url;
  }
}

function hasJsonBody(options?: RequestInit) {
  return options?.body !== undefined && !(options.body instanceof FormData);
}

async function readJsonSafely(res: Response) {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractErrorMessage(json: unknown) {
  if (!json || typeof json !== 'object') return null;

  const payload = json as {
    message?: string | string[];
    error?: { message?: string };
  };

  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.error?.message === 'string') return payload.error.message;
  if (Array.isArray(payload.message)) return payload.message.join(', ');
  return null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken =
    typeof window !== 'undefined'
      ? localStorage.getItem('refreshToken')
      : null;

  if (!refreshToken) return null;

  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshRes.ok) return null;

  const refreshJson = await readJsonSafely(refreshRes);
  const newToken = refreshJson?.data?.accessToken ?? refreshJson?.accessToken;

  if (!newToken || typeof window === 'undefined') return null;

  localStorage.setItem('accessToken', newToken);
  document.cookie = `accessToken=${newToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;
  return newToken;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const shouldSendJsonHeader = hasJsonBody(options);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(shouldSendJsonHeader ? { 'Content-Type': 'application/json' } : {}),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();

      if (newToken) {
        const retryRes = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: {
            ...(shouldSendJsonHeader ? { 'Content-Type': 'application/json' } : {}),
            Authorization: `Bearer ${newToken}`,
            ...options?.headers,
          },
        });
        const retryJson = await readJsonSafely(retryRes);
        if (!retryRes.ok) {
          throw new Error(extractErrorMessage(retryJson) || 'Request failed');
        }
        return (retryJson?.data ?? retryJson) as T;
      }
    } catch (refreshErr) {
      console.error('[apiFetch] Token refresh failed:', refreshErr);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'accessToken=; path=/; max-age=0';
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const json = await readJsonSafely(res);
  if (!res.ok) throw new Error(extractErrorMessage(json) || 'Request failed');
  return (json?.data ?? json) as T;
}
