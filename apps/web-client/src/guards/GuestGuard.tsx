import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../lib/storage";

export default function GuestGuard() {
  const accessToken = getAccessToken();

  if (accessToken) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}