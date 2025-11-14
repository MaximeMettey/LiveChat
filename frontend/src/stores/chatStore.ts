import { create } from 'zustand';
import { roomAPI, messageAPI } from '@/lib/api';
import { socketService } from '@/lib/socket';
import type { Room, Message } from '@/types';
import toast from 'react-hot-toast';

interface ChatState {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Record<string, Message[]>;
  privateMessages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  isLoading: boolean;

  loadRooms: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: Room | null) => void;
  loadRoomMessages: (roomId: string) => Promise<void>;
  loadPrivateMessages: (userId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  setTyping: (roomId: string, userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  messages: {},
  privateMessages: {},
  typingUsers: {},
  isLoading: false,

  loadRooms: async () => {
    try {
      set({ isLoading: true });
      const response = await roomAPI.getRooms();
      set({ rooms: response.data });
    } catch (error: any) {
      toast.error('Erreur lors du chargement des salons');
    } finally {
      set({ isLoading: false });
    }
  },

  joinRoom: async (roomId) => {
    try {
      await roomAPI.joinRoom(roomId);
      socketService.joinRoom(roomId);
      await get().loadRoomMessages(roomId);

      const room = get().rooms.find(r => r.id === roomId);
      if (room) {
        set({ currentRoom: room });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur en rejoignant le salon');
    }
  },

  leaveRoom: async (roomId) => {
    try {
      await roomAPI.leaveRoom(roomId);
      socketService.leaveRoom(roomId);
      set({ currentRoom: null });
    } catch (error: any) {
      toast.error('Erreur en quittant le salon');
    }
  },

  setCurrentRoom: (room) => {
    set({ currentRoom: room });
  },

  loadRoomMessages: async (roomId) => {
    try {
      const response = await messageAPI.getRoomMessages(roomId);
      set((state) => ({
        messages: {
          ...state.messages,
          [roomId]: response.data,
        },
      }));
    } catch (error: any) {
      toast.error('Erreur lors du chargement des messages');
    }
  },

  loadPrivateMessages: async (userId) => {
    try {
      const response = await messageAPI.getPrivateMessages(userId);
      set((state) => ({
        privateMessages: {
          ...state.privateMessages,
          [userId]: response.data,
        },
      }));
    } catch (error: any) {
      toast.error('Erreur lors du chargement des messages');
    }
  },

  addMessage: (message) => {
    if (message.isPrivate) {
      const otherUserId = message.senderId === message.receiverId ? message.senderId : message.receiverId!;
      set((state) => ({
        privateMessages: {
          ...state.privateMessages,
          [otherUserId]: [...(state.privateMessages[otherUserId] || []), message],
        },
      }));
    } else if (message.roomId) {
      set((state) => ({
        messages: {
          ...state.messages,
          [message.roomId!]: [...(state.messages[message.roomId!] || []), message],
        },
      }));
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await messageAPI.deleteMessage(messageId);
      toast.success('Message supprimé');

      // Supprimer le message localement
      set((state) => {
        const newMessages = { ...state.messages };
        const newPrivateMessages = { ...state.privateMessages };

        Object.keys(newMessages).forEach((roomId) => {
          newMessages[roomId] = newMessages[roomId].filter(m => m.id !== messageId);
        });

        Object.keys(newPrivateMessages).forEach((userId) => {
          newPrivateMessages[userId] = newPrivateMessages[userId].filter(m => m.id !== messageId);
        });

        return { messages: newMessages, privateMessages: newPrivateMessages };
      });
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
    }
  },

  setTyping: (roomId, userId, isTyping) => {
    set((state) => {
      const current = state.typingUsers[roomId] || [];
      const newTyping = isTyping
        ? [...current.filter(id => id !== userId), userId]
        : current.filter(id => id !== userId);

      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: newTyping,
        },
      };
    });
  },
}));
