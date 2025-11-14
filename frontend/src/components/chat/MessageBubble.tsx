import { useState } from 'react';
import { Message } from '@/types';
import { format } from 'date-fns';
import { MoreVertical, Trash2, Flag, Shield } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { userAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { deleteMessage } = useChatStore();
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';
  const canDelete = isOwn || isModerator;

  const handleDelete = async () => {
    if (confirm('Supprimer ce message ?')) {
      await deleteMessage(message.id);
      setShowMenu(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Raison du signalement :');
    if (reason) {
      try {
        await userAPI.reportUser(message.senderId, {
          reason: 'INAPPROPRIATE_CONTENT',
          description: `Message: "${message.content}" - Raison: ${reason}`,
        });
        toast.success('Signalement envoyé');
        setShowMenu(false);
      } catch (error) {
        // Error handled by API
      }
    }
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
    >
      <div
        className={`max-w-[70%] ${
          isOwn ? 'order-2' : 'order-1'
        } relative`}
      >
        {/* Message */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          {!isOwn && (
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm">
                {message.sender.username}
              </span>
              {message.sender.role === 'MODERATOR' && (
                <Shield className="w-3 h-3 text-blue-500" />
              )}
              {message.sender.role === 'ADMIN' && (
                <Shield className="w-3 h-3 text-red-500" />
              )}
            </div>
          )}
          <p className="break-words whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <p
          className={`text-xs text-gray-500 mt-1 ${
            isOwn ? 'text-right' : 'text-left'
          }`}
        >
          {format(new Date(message.createdAt), 'HH:mm')}
        </p>

        {/* Menu */}
        {!isOwn && (
          <div
            className={`absolute top-0 ${
              isOwn ? 'left-0 -translate-x-8' : 'right-0 translate-x-8'
            } opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </button>
                  )}
                  {!isOwn && (
                    <button
                      onClick={handleReport}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-gray-700"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Signaler</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
