'use client';
import { create } from 'zustand';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
  store: { id: string; name: string; plan: string };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  logout: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}));
