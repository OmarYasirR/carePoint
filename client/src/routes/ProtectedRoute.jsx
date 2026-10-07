import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Blocks access to any nested route unless the user is authenticated,
 * redirecting to /login and remembering where they were headed.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
