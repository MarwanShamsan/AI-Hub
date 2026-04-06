import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken } from "../lib/storage";

export default function AuthGuard() {
  const location = useLocation();
  const accessToken = getAccessToken();

  if (!accessToken) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}