import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { socketService } from '@/lib/socket';
import { Send, MoreVertical, Users } from 'lucide-react';
import MessageBubble from './MessageBubble';
import RoomUsersList from './RoomUsersList';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChatAreaProps {
  onToggleRightPanel: () => void;
}

export default function ChatArea({ onToggleRightPanel }: ChatAreaProps) {
  const { currentRoom, messages, typingUsers, loadRoomMessages } = useChatStore();
  const { user } = useAuthStore();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showUsersList, setShowUsersList] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (currentRoom) {
      loadRoomMessages(currentRoom.id);
    }
  }, [currentRoom, loadRoomMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentRoom]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !currentRoom) return;

    socketService.sendMessage(currentRoom.id, messageText.trim());
    setMessageText('');
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!currentRoom || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping({ roomId: currentRoom.id });
    }

    // Reset le timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    if (isTyping && currentRoom) {
      setIsTyping(false);
      socketService.stopTyping({ roomId: currentRoom.id });
    }
  };

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Sélectionnez un salon</p>
          <p className="text-sm">Choisissez un salon pour commencer à chatter</p>
        </div>
      </div>
    );
  }

  const roomMessages = messages[currentRoom.id] || [];
  const typing = typingUsers[currentRoom.id] || [];

  return (
    <div className="flex-1 flex bg-white">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">#{currentRoom.name}</h2>
            {currentRoom.description && (
              <p className="text-sm text-gray-500">{currentRoom.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUsersList(!showUsersList)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={showUsersList ? 'Masquer les utilisateurs' : 'Afficher les utilisateurs'}
            >
              <Users className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onToggleRightPanel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {roomMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Aucun message pour le moment</p>
            <p className="text-sm">Soyez le premier à parler !</p>
          </div>
        ) : (
          roomMessages.map((message, index) => {
            const showDateDivider =
              index === 0 ||
              format(new Date(roomMessages[index - 1].createdAt), 'dd/MM/yyyy') !==
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

        {/* Typing indicator */}
        {typing.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
            <span>Quelqu'un écrit...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
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

      {/* Users List Panel */}
      {showUsersList && <RoomUsersList roomId={currentRoom.id} />}
    </div>
  );
}
