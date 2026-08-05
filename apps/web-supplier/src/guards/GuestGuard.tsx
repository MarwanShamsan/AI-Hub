import { Navigate, Outlet } from "react-router-dom";
import { getSessionUser } from "../features/auth/session";

export function GuestGuard() {
  const user = getSessionUser();

  if (user?.role === "supplier") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}