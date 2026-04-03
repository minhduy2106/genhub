'use client';
import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Token is invalid, clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
        set({ user: null, accessToken: null, isAuthenticated: false, isRehydrating: false });
        return;
      }
      const json = await res.json();
      const user = json.data ?? json;
      set({ user, accessToken: token, isAuthenticated: true, isRehydrating: false });
    } catch {
      set({ isRehydrating: false });
    }
  },
}));
