import { useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useFriendStore } from '@/stores/friendStore';
import { socketService } from '@/lib/socket';

// Components
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';
import PrivateChat from '@/components/chat/PrivateChat';
import RightPanel from '@/components/chat/RightPanel';
import MobileNav from '@/components/chat/MobileNav';

export default function ChatPage() {
  const { loadRooms, currentPrivateChat } = useChatStore();
  const { loadFriends, loadFriendRequests, updateFriendStatus } = useFriendStore();
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [activeView, setActiveView] = useState<'rooms' | 'friends' | 'profile'>('rooms');

  useEffect(() => {
    loadRooms();
    loadFriends();
    loadFriendRequests();

    // Écouter les événements Socket.io
    const socket = socketService.getSocket();

    if (socket) {
      socket.on('message:new', (message) => {
        useChatStore.getState().addMessage(message);
      });

      socket.on('message:private_new', (message) => {
        useChatStore.getState().addMessage(message);
      });

      socket.on('friend:status', ({ userId, status }) => {
        updateFriendStatus(userId, status);
      });

      socket.on('friend:request_received', () => {
        loadFriendRequests();
      });

      socket.on('typing:start', ({ userId, username, roomId }) => {
        if (roomId) {
          useChatStore.getState().setTyping(roomId, userId, true);
        }
      });

      socket.on('typing:stop', ({ userId, roomId }) => {
        if (roomId) {
          useChatStore.getState().setTyping(roomId, userId, false);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('message:new');
        socket.off('message:private_new');
        socket.off('friend:status');
        socket.off('friend:request_received');
        socket.off('typing:start');
        socket.off('typing:stop');
      }
    };
  }, [loadRooms, loadFriends, loadFriendRequests, updateFriendStatus]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Sidebar />
        {currentPrivateChat ? (
          <PrivateChat onToggleRightPanel={() => setShowRightPanel(!showRightPanel)} />
        ) : (
          <ChatArea onToggleRightPanel={() => setShowRightPanel(!showRightPanel)} />
        )}
        {showRightPanel && <RightPanel onClose={() => setShowRightPanel(false)} />}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        {activeView === 'rooms' && <Sidebar mobile />}
        {activeView === 'friends' && <RightPanel onClose={() => {}} mobile />}
        {activeView === 'profile' && <RightPanel onClose={() => {}} mobile showProfile />}

        <MobileNav activeView={activeView} onViewChange={setActiveView} />
      </div>
    </div>
  );
}
