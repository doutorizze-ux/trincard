import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, adminOnly = false }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#FF3131] mx-auto mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If loading is finished but userProfile is still null (e.g. timeout), we might want to let them through if basic user exists,
  // OR redirect them to an error page. For now, we assume if user exists, we can proceed, 
  // but if requireAdmin is true, we must fail.

  if ((requireAdmin || adminOnly) && !userProfile?.is_admin) {
    // Redirect to dashboard if user is not admin
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
