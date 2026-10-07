import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Restricts a subtree of routes to one or more roles, e.g.:
 * <Route element={<RoleRoute allowed={['admin']} />}> ... </Route>
 */
export default function RoleRoute({ allowed }) {
  const { user } = useSelector((s) => s.auth);
  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
