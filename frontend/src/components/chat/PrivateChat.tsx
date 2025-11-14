import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketService } from '@/lib/socket';
import { Send, MoreVertical, ArrowLeft } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrivateChatProps {
  onToggleRightPanel: () => void;
}

export default function PrivateChat({ onToggleRightPanel }: PrivateChatProps) {
  const { currentPrivateChat, privateMessages, setCurrentRoom } = useChatStore();
  const { user } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessages, currentPrivateChat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !currentPrivateChat) return;

    socketService.sendPrivateMessage(currentPrivateChat.userId, messageText.trim());
    setMessageText('');
  };

  const handleBackToRooms = () => {
    setCurrentRoom(null);
  };

  if (!currentPrivateChat) {
    return null;
  }

  const chatMessages = privateMessages[currentPrivateChat.userId] || [];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBackToRooms}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              {currentPrivateChat.avatar ? (
                <img
                  src={currentPrivateChat.avatar}
                  alt={currentPrivateChat.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-primary-600 font-semibold">
                  {currentPrivateChat.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{currentPrivateChat.username}</h2>
              <p className="text-sm text-gray-500">Message privé</p>
            </div>
          </div>
        </div>

        <button
          onClick={onToggleRightPanel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Envoyez le premier message !</p>
          </div>
        ) : (
          chatMessages.map((message, index) => {
            const showDateDivider =
              index === 0 ||
              format(new Date(chatMessages[index - 1].createdAt), 'dd/MM/yyyy') !==
                format(new Date(message.createdAt), 'dd/MM/yyyy');

            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                      {format(new Date(message.createdAt), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </div>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isOwn={message.senderId === user?.id}
                />
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
