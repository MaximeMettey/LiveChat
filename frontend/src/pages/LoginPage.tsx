import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { MessageCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAnonymous, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'anonymous'>('anonymous');

  // Formulaire anonyme
  const [anonymousData, setAnonymousData] = useState({
    username: '',
    age: 18,
    department: '',
  });

  // Formulaire connexion
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleAnonymousSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAnonymous(anonymousData);
      navigate('/chat');
    } catch (error) {
      // Error handled by store
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData);
      navigate('/chat');
    } catch (error) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <MessageCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">LiveChat</h1>
          <p className="text-primary-100">Chat anonyme en temps réel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Tabs */}
          <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('anonymous')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === 'anonymous'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Anonyme
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Connexion
            </button>
          </div>

          {/* Formulaire anonyme */}
          {mode === 'anonymous' && (
            <form onSubmit={handleAnonymousSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pseudo
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  value={anonymousData.username}
                  onChange={(e) =>
                    setAnonymousData({ ...anonymousData, username: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Votre pseudo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Âge
                </label>
                <input
                  type="number"
                  required
                  min={13}
                  max={99}
                  value={anonymousData.age}
                  onChange={(e) =>
                    setAnonymousData({ ...anonymousData, age: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{2,3}|2[AB]"
                  maxLength={3}
                  value={anonymousData.department}
                  onChange={(e) =>
                    setAnonymousData({ ...anonymousData, department: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: 75, 69, 2A"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Connexion...' : 'Commencer à chatter'}
              </button>

              <p className="text-sm text-gray-600 text-center">
                Ou{' '}
                <Link to="/register" className="text-primary-600 hover:underline font-medium">
                  créer un compte
                </Link>
              </p>
            </form>
          )}

          {/* Formulaire connexion */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>

              <p className="text-sm text-gray-600 text-center">
                Pas de compte ?{' '}
                <Link to="/register" className="text-primary-600 hover:underline font-medium">
                  S'inscrire
                </Link>
              </p>
            </form>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-primary-100 text-sm">
          <p>✨ Chattez anonymement sans inscription</p>
          <p>💬 Rejoignez des salons thématiques</p>
          <p>👥 Ajoutez des amis et discutez en privé</p>
        </div>
      </div>
    </div>
  );
}
