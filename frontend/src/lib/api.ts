import axios from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  AnonymousCredentials,
  User,
  Room,
  Message,
  Friend,
  Friendship,
  Block,
  Report
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token aux requêtes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  loginAnonymous: (data: AnonymousCredentials) =>
    api.post<AuthResponse>('/auth/anonymous', data),

  register: (data: RegisterCredentials) =>
    api.post<AuthResponse>('/auth/register', data),

  login: (data: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', data),
};

// Users
export const userAPI = {
  getMe: () =>
    api.get<User>('/users/me'),

  updateMe: (data: Partial<User>) =>
    api.patch<User>('/users/me', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<{ avatar: string }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getUser: (id: string) =>
    api.get<User>(`/users/${id}`),

  searchUsers: (params: { search?: string; department?: string }) =>
    api.get<User[]>('/users', { params }),

  blockUser: (id: string) =>
    api.post(`/users/${id}/block`),

  unblockUser: (id: string) =>
    api.delete(`/users/${id}/block`),

  getBlocks: () =>
    api.get<Block[]>('/users/me/blocks'),

  reportUser: (id: string, data: { reason: string; description?: string }) =>
    api.post(`/users/${id}/report`, data),
};

// Rooms
export const roomAPI = {
  getRooms: () =>
    api.get<Room[]>('/rooms'),

  getRoom: (id: string) =>
    api.get<Room>(`/rooms/${id}`),

  createRoom: (data: Partial<Room>) =>
    api.post<Room>('/rooms', data),

  joinRoom: (id: string) =>
    api.post(`/rooms/${id}/join`),

  leaveRoom: (id: string) =>
    api.post(`/rooms/${id}/leave`),

  getMyRooms: () =>
    api.get<Room[]>('/rooms/user/me'),
};

// Messages
export const messageAPI = {
  getRoomMessages: (roomId: string, params?: { limit?: number; before?: string }) =>
    api.get<Message[]>(`/messages/room/${roomId}`, { params }),

  getPrivateMessages: (userId: string, params?: { limit?: number; before?: string }) =>
    api.get<Message[]>(`/messages/private/${userId}`, { params }),

  getConversations: () =>
    api.get<any[]>('/messages/private/conversations'),

  deleteMessage: (messageId: string) =>
    api.delete(`/messages/${messageId}`),
};

// Friends
export const friendAPI = {
  getFriends: () =>
    api.get<Friend[]>('/friends'),

  getFriendRequests: () =>
    api.get<Friendship[]>('/friends/requests'),

  sendFriendRequest: (userId: string) =>
    api.post(`/friends/${userId}`),

  acceptFriendRequest: (friendshipId: string) =>
    api.post(`/friends/${friendshipId}/accept`),

  deleteFriendship: (friendshipId: string) =>
    api.delete(`/friends/${friendshipId}`),
};

// Moderation
export const moderationAPI = {
  getReports: (status?: string) =>
    api.get<Report[]>('/moderation/reports', { params: { status } }),

  updateReport: (reportId: string, status: string) =>
    api.patch(`/moderation/reports/${reportId}`, { status }),

  createAction: (data: any) =>
    api.post('/moderation/actions', data),

  getActions: (userId: string) =>
    api.get(`/moderation/actions/${userId}`),

  getStats: () =>
    api.get('/moderation/stats'),
};

export default api;
