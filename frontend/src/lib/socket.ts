import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connecté au WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Déconnecté du WebSocket');
    });

    this.socket.on('error', (error: any) => {
      console.error('Erreur WebSocket:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Room events
  joinRoom(roomId: string) {
    this.socket?.emit('room:join', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('room:leave', roomId);
  }

  sendMessage(roomId: string, content: string) {
    this.socket?.emit('message:send', { roomId, content });
  }

  // Private messages
  sendPrivateMessage(receiverId: string, content: string) {
    this.socket?.emit('message:private', { receiverId, content });
  }

  // Typing indicators
  startTyping(data: { roomId?: string; receiverId?: string }) {
    this.socket?.emit('typing:start', data);
  }

  stopTyping(data: { roomId?: string; receiverId?: string }) {
    this.socket?.emit('typing:stop', data);
  }

  // Friend request
  sendFriendRequest(targetId: string) {
    this.socket?.emit('friend:request', { targetId });
  }

  // Event listeners
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
