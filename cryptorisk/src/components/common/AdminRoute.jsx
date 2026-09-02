import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


/**
 * AdminRoute — wraps any route that requires admin access.
 *
 * • If user is not logged in → redirect to /login
 * • If user is logged in but role !== "admin" → redirect to /dashboard
 * • If user is admin → render children normally
 *
 * This blocks direct URL access (e.g. typing /admin in the address bar).
 * The real security is the backend middleware — this is a UX guard only.
 */
export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
