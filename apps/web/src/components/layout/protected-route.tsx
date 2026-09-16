import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
