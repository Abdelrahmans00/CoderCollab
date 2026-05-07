import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setAuth: (user: User, token: string) => void;
  hydrateAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isHydrating: true,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isHydrating: false });
  },

  hydrateAuth: async () => {
    const token = get().token ?? localStorage.getItem('token');

    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isHydrating: false });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      set({
        user: data,
        token,
        isAuthenticated: true,
        isHydrating: false,
      });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isHydrating: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isHydrating: false });
  },
}));