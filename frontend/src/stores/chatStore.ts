import { create } from 'zustand';
import { roomAPI, messageAPI } from '@/lib/api';
import { socketService } from '@/lib/socket';
import type { Room, Message } from '@/types';
import toast from 'react-hot-toast';

interface Conversation {
  userId: string;
  username: string;
  avatar?: string;
  lastMessage?: Message;
  unreadCount?: number;
}

interface ChatState {
  rooms: Room[];
  currentRoom: Room | null;
  currentPrivateChat: { userId: string; username: string; avatar?: string } | null;
  messages: Record<string, Message[]>;
  privateMessages: Record<string, Message[]>;
  conversations: Conversation[];
  typingUsers: Record<string, string[]>;
  isLoading: boolean;

  loadRooms: () => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: Room | null) => void;
  startPrivateChat: (userId: string, username: string, avatar?: string) => void;
  loadRoomMessages: (roomId: string) => Promise<void>;
  loadPrivateMessages: (userId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  addMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  setTyping: (roomId: string, userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  currentPrivateChat: null,
  messages: {},
  privateMessages: {},
  conversations: [],
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
      const room = get().rooms.find(r => r.id === roomId);

      // Si c'est le salon actuel, on recharge juste les messages
      if (get().currentRoom?.id === roomId) {
        await get().loadRoomMessages(roomId);
        return;
      }

      // Essayer de rejoindre le salon (peut échouer si déjà membre)
      try {
        await roomAPI.joinRoom(roomId);
      } catch (error: any) {
        // Si l'erreur est "déjà membre", on ignore et on continue
        const errorMessage = error.response?.data?.error || '';
        if (!errorMessage.includes('déjà') && !errorMessage.includes('already')) {
          throw error; // Re-throw si c'est une autre erreur
        }
        // Sinon on ignore l'erreur et on continue pour charger les messages
      }

      // Rejoindre via Socket.io et charger les messages
      socketService.joinRoom(roomId);
      await get().loadRoomMessages(roomId);

      if (room) {
        set({ currentRoom: room, currentPrivateChat: null });
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
    set({ currentRoom: room, currentPrivateChat: null });
  },

  startPrivateChat: async (userId, username, avatar) => {
    set({ currentPrivateChat: { userId, username, avatar }, currentRoom: null });
    await get().loadPrivateMessages(userId);
  },

  loadConversations: async () => {
    try {
      const response = await messageAPI.getConversations();
      const rawConversations = response.data as any[];

      // Transformer les données pour correspondre à l'interface Conversation
      const conversations: Conversation[] = rawConversations.map((conv) => ({
        userId: conv.otherUser?.id || conv.otherUserId,
        username: conv.otherUser?.username || 'Utilisateur inconnu',
        avatar: conv.otherUser?.avatar,
        lastMessage: {
          id: conv.id,
          content: conv.content,
          senderId: conv.senderId,
          receiverId: conv.receiverId,
          createdAt: conv.createdAt,
          isPrivate: true,
          roomId: null
        } as Message,
        unreadCount: 0 // TODO: implement unread count
      }));

      set({ conversations });
    } catch (error: any) {
      console.error('Erreur chargement conversations:', error);
      toast.error('Erreur lors du chargement des conversations');
    }
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
