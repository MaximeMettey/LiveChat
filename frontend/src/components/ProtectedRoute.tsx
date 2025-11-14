import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireModerator?: boolean;
}

export default function ProtectedRoute({ children, requireModerator = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireModerator && user?.role !== 'MODERATOR' && user?.role !== 'ADMIN') {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
}
