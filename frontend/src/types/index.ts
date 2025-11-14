export interface User {
  id: string;
  username: string;
  email?: string;
  age: number;
  department: string;
  avatar?: string;
  bio?: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  isAnonymous: boolean;
  createdAt?: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  maxUsers: number;
  createdAt: string;
  _count?: {
    members: number;
  };
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  roomId?: string;
  receiverId?: string;
  isPrivate: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
    role: string;
  };
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  accepted: boolean;
  createdAt: string;
  user?: User;
  friend?: User;
}

export interface Friend {
  friendshipId: string;
  id: string;
  username: string;
  avatar?: string;
  status: string;
  department: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
  blocked: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'IMPERSONATION' | 'OTHER';
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  age: number;
  department: string;
}

export interface AnonymousCredentials {
  username: string;
  age: number;
  department: string;
}
