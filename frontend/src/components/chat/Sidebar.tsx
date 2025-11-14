import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { Hash, Users, Settings, Shield, LogOut } from 'lucide-react';

interface SidebarProps {
  mobile?: boolean;
}

export default function Sidebar({ mobile = false }: SidebarProps) {
  const { rooms, currentRoom, joinRoom, loadRooms } = useChatStore();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  return (
    <div className={`${mobile ? 'flex-1' : 'w-64'} bg-white border-r border-gray-200 flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-primary-600">LiveChat</h1>
          <Link
            to="/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </Link>
        </div>

        {/* User info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-primary-600 font-semibold">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user?.username}</p>
            <p className="text-xs text-gray-500">
              {user?.department} • {user?.age} ans
            </p>
          </div>
        </div>
      </div>

      {/* Salons */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase">
            Salons publics
          </h2>
          <Users className="w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => joinRoom(room.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                currentRoom?.id === room.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Hash className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium truncate">{room.name}</p>
                {room.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {room.description}
                  </p>
                )}
              </div>
              {room._count && (
                <span className="text-xs text-gray-500">
                  {room._count.members}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 space-y-1">
        {isModerator && (
          <Link
            to="/moderation"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Modération</span>
          </Link>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}
