import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const DASHBOARD_BY_ROLE = { admin: '/admin', doctor: '/doctor', patient: '/patient' };

/**
 * Wraps /login and /register: if a session was already restored via
 * the persistent-login check (bootstrapAuth), skip the auth form
 * entirely and go straight to the right dashboard instead of making
 * someone who's already signed in look at a login screen.
 */
export default function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  if (isAuthenticated) {
    return <Navigate to={DASHBOARD_BY_ROLE[user?.role] || '/'} replace />;
  }
  return children;
}