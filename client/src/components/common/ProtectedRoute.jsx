import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// UI guard only. The server enforces every permission independently.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading" role="status">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
