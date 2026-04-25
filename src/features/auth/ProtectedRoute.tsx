import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthProvider";
import type { AppRole } from "./auth.types";
import { getDefaultRouteForRole } from "./auth.utils";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: AppRole[] }) {
  const { isAuthenticated, isLoading, session, currentRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-600">Loading session...</div>;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && (!currentRole || !allowedRoles.includes(currentRole))) {
    return <Navigate to={getDefaultRouteForRole(currentRole ?? session.activeRole)} replace />;
  }

  return <Outlet />;
}
