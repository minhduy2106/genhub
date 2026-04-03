const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    // Try refresh token
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          const newToken = refreshJson.data?.accessToken ?? refreshJson.accessToken;
          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            document.cookie = `accessToken=${newToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;
            // Retry original request with new token
            const retryRes = await fetch(`${API_URL}${path}`, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
                ...options?.headers,
              },
            });
            const retryJson = await retryRes.json();
            if (!retryRes.ok) throw new Error(retryJson.message || 'Request failed');
            return (retryJson.data ?? retryJson) as T;
          }
        }
      } catch {
        // Refresh failed, redirect to login
      }
    }
    // No refresh token or refresh failed
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'accessToken=; path=/; max-age=0';
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Request failed');
  return (json.data ?? json) as T;
}
