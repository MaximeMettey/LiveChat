import { create } from 'zustand';
import { authAPI, userAPI } from '@/lib/api';
import { socketService } from '@/lib/socket';
import type { User, LoginCredentials, RegisterCredentials, AnonymousCredentials } from '@/types';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  loginAnonymous: (data: AnonymousCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  login: (data: LoginCredentials) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: false,

  loginAnonymous: async (data) => {
    try {
      set({ isLoading: true });
      const response = await authAPI.loginAnonymous(data);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });

      socketService.connect(token);
      toast.success(`Bienvenue ${user.username} !`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur de connexion');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true });
      const response = await authAPI.register(data);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });

      socketService.connect(token);
      toast.success('Compte créé avec succès !');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'inscription');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (data) => {
    try {
      set({ isLoading: true });
      const response = await authAPI.login(data);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true });

      socketService.connect(token);
      toast.success(`Bon retour ${user.username} !`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur de connexion');
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    socketService.disconnect();
    set({ user: null, token: null, isAuthenticated: false });
    toast.success('Déconnexion réussie');
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true });
      const response = await userAPI.getMe();
      set({ user: response.data, isAuthenticated: true });

      socketService.connect(token);
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: async (data) => {
    try {
      const response = await userAPI.updateMe(data);
      set({ user: response.data });
      toast.success('Profil mis à jour');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
      throw error;
    }
  },
}));
