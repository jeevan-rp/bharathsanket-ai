import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * Guards routes based on authentication status and required role.
 * - If not authenticated -> redirects to /login
 * - If role does not match -> redirects to user's assigned portal
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role && role !== allowedRole) {
    // Redirect to correct dashboard based on role
    return <Navigate to={role === 'official' ? '/official/dashboard' : '/citizen/dashboard'} replace />;
  }

  return children;
}
