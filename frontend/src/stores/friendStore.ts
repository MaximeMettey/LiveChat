import { create } from 'zustand';
import { friendAPI } from '@/lib/api';
import type { Friend, Friendship } from '@/types';
import toast from 'react-hot-toast';

interface FriendState {
  friends: Friend[];
  friendRequests: Friendship[];
  isLoading: boolean;

  loadFriends: () => Promise<void>;
  loadFriendRequests: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  updateFriendStatus: (userId: string, status: string) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  friendRequests: [],
  isLoading: false,

  loadFriends: async () => {
    try {
      set({ isLoading: true });
      const response = await friendAPI.getFriends();
      set({ friends: response.data });
    } catch (error: any) {
      toast.error('Erreur lors du chargement des amis');
    } finally {
      set({ isLoading: false });
    }
  },

  loadFriendRequests: async () => {
    try {
      const response = await friendAPI.getFriendRequests();
      set({ friendRequests: response.data });
    } catch (error: any) {
      toast.error('Erreur lors du chargement des demandes');
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      await friendAPI.sendFriendRequest(userId);
      toast.success('Demande d\'ami envoyée');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    }
  },

  acceptFriendRequest: async (friendshipId) => {
    try {
      await friendAPI.acceptFriendRequest(friendshipId);
      toast.success('Demande acceptée');
      await get().loadFriends();
      await get().loadFriendRequests();
    } catch (error: any) {
      toast.error('Erreur lors de l\'acceptation');
    }
  },

  removeFriend: async (friendshipId) => {
    try {
      await friendAPI.deleteFriendship(friendshipId);
      toast.success('Ami supprimé');
      await get().loadFriends();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
    }
  },

  updateFriendStatus: (userId, status) => {
    set((state) => ({
      friends: state.friends.map(friend =>
        friend.id === userId ? { ...friend, status } : friend
      ),
    }));
  },
}));
