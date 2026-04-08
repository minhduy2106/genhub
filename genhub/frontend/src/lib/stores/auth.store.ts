'use client';
import { create } from 'zustand';
import { API_URL, refreshAccessToken } from '@/lib/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  permissions: string[];
  store: { id: string; name: string; plan: string };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isRehydrating: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  rehydrate: () => Promise<void>;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  isRehydrating: false,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  rehydrate: async () => {
    const token = get().accessToken || getStoredToken();
    if (!token) {
      set({ user: null, accessToken: null, isAuthenticated: false });
      return;
    }
    set({ isRehydrating: true });
    try {
      let activeToken = token;
      let res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (res.status === 401) {
        const refreshedToken = await refreshAccessToken();
        if (!refreshedToken) {
          throw new Error('Unauthorized');
        }

        activeToken = refreshedToken;
        res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
      }

      if (!res.ok) {
        throw new Error('Unauthorized');
      }

      const json = await res.json();
      const user = json.data ?? json;
      set({
        user,
        accessToken: activeToken,
        isAuthenticated: true,
        isRehydrating: false,
      });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
      set({ user: null, accessToken: null, isAuthenticated: false, isRehydrating: false });
    }
  },
}));
