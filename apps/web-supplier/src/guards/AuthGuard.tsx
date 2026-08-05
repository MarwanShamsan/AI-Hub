import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSessionUser } from "../features/auth/session";

export function AuthGuard() {
  const location = useLocation();
  const user = getSessionUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "supplier") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}