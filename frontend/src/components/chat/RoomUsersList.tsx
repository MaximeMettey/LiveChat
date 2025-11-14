import { useEffect, useState } from 'react';
import { roomAPI } from '@/lib/api';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { Users as UsersIcon, User, MessageCircle } from 'lucide-react';
import type { Room } from '@/types';

interface RoomUser {
  id: string;
  username: string;
  avatar?: string;
  status: string;
}

interface RoomUsersListProps {
  roomId: string;
}

export default function RoomUsersList({ roomId }: RoomUsersListProps) {
  const { startPrivateChat } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    loadUsers();
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadUsers, 30000);
    return () => clearInterval(interval);
  }, [roomId]);

  const loadUsers = async () => {
    try {
      const response = await roomAPI.getRoom(roomId);
      const room = response.data as any;

      const roomUsers = room.members
        ?.map((member: any) => ({
          id: member.user.id,
          username: member.user.username,
          avatar: member.user.avatar,
          status: member.user.status,
        }))
        .filter((user: RoomUser) => user.id !== currentUser?.id) || []; // Exclure l'utilisateur actuel

      setUsers(roomUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = (user: RoomUser) => {
    startPrivateChat(user.id, user.username, user.avatar);
  };

  const onlineUsers = users.filter(u => u.status === 'ONLINE');
  const offlineUsers = users.filter(u => u.status !== 'ONLINE');

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div
        className="p-4 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <UsersIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            Utilisateurs ({users.length})
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-500">{onlineUsers.length}</span>
        </div>
      </div>

      {/* Users List */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Chargement...</p>
            </div>
          ) : (
            <>
              {/* Online Users */}
              {onlineUsers.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
                    En ligne — {onlineUsers.length}
                  </h4>
                  <div className="space-y-1">
                    {onlineUsers.map((user) => (
                      <div
                        key={user.id}
                        className="group flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => handleStartChat(user)}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-primary-600" />
                            )}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate flex-1">
                          {user.username}
                        </span>
                        <MessageCircle className="w-4 h-4 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offline Users */}
              {offlineUsers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
                    Hors ligne — {offlineUsers.length}
                  </h4>
                  <div className="space-y-1">
                    {offlineUsers.map((user) => (
                      <div
                        key={user.id}
                        className="group flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer transition-colors opacity-60 hover:opacity-100"
                        onClick={() => handleStartChat(user)}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="w-8 h-8 rounded-full object-cover grayscale"
                              />
                            ) : (
                              <User className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                        </div>
                        <span className="text-sm text-gray-600 truncate flex-1">
                          {user.username}
                        </span>
                        <MessageCircle className="w-4 h-4 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Aucun utilisateur</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
