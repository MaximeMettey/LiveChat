import { useFriendStore } from '@/stores/friendStore';
import { useAuthStore } from '@/stores/authStore';
import { X, UserPlus, Check, X as XIcon, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RightPanelProps {
  onClose: () => void;
  mobile?: boolean;
  showProfile?: boolean;
}

export default function RightPanel({ onClose, mobile = false, showProfile = false }: RightPanelProps) {
  const { friends, friendRequests, acceptFriendRequest, removeFriend } = useFriendStore();
  const { user } = useAuthStore();

  if (showProfile && user) {
    return (
      <div className={`${mobile ? 'flex-1' : 'w-80'} bg-white border-l border-gray-200 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Mon Profil</h2>
          {!mobile && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl text-primary-600 font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{user.username}</h3>
            <p className="text-gray-500">
              {user.age} ans • Département {user.department}
            </p>
            {user.bio && (
              <p className="text-sm text-gray-600 mt-2">{user.bio}</p>
            )}
          </div>

          <Link
            to="/profile"
            className="block w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-center font-medium"
          >
            Modifier mon profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${mobile ? 'flex-1' : 'w-80'} bg-white border-l border-gray-200 flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Amis</h2>
        {!mobile && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Demandes en attente ({friendRequests.length})
            </h3>
            <div className="space-y-2">
              {friendRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {request.user?.avatar ? (
                      <img
                        src={request.user.avatar}
                        alt={request.user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {request.user?.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.user?.age} ans • {request.user?.department}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => acceptFriendRequest(request.id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Accepter"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFriend(request.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Refuser"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">
              Mes amis ({friends.length})
            </h3>
            <Link
              to="/friends"
              className="text-sm text-primary-600 hover:underline"
            >
              Voir tout
            </Link>
          </div>

          {friends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Aucun ami pour le moment</p>
              <p className="text-xs">Ajoutez des amis pour chatter !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.slice(0, 10).map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        friend.status === 'ONLINE'
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {friend.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {friend.status === 'ONLINE' ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
