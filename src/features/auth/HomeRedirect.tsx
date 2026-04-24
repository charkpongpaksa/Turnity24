import { Navigate } from "react-router";
import { useAuth } from "./AuthProvider";

export function HomeRedirect() {
  const { homePath } = useAuth();
  return <Navigate to={homePath} replace />;
}
