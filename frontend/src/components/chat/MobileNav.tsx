import { Hash, Users, User } from 'lucide-react';

interface MobileNavProps {
  activeView: 'rooms' | 'friends' | 'profile';
  onViewChange: (view: 'rooms' | 'friends' | 'profile') => void;
}

export default function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  return (
    <div className="h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4">
      <button
        onClick={() => onViewChange('rooms')}
        className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-colors ${
          activeView === 'rooms'
            ? 'text-primary-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Hash className="w-6 h-6" />
        <span className="text-xs font-medium">Salons</span>
      </button>

      <button
        onClick={() => onViewChange('friends')}
        className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-colors ${
          activeView === 'friends'
            ? 'text-primary-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Users className="w-6 h-6" />
        <span className="text-xs font-medium">Amis</span>
      </button>

      <button
        onClick={() => onViewChange('profile')}
        className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-colors ${
          activeView === 'profile'
            ? 'text-primary-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <User className="w-6 h-6" />
        <span className="text-xs font-medium">Profil</span>
      </button>
    </div>
  );
}
