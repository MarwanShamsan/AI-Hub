import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAccessToken, getStoredUser } from "../lib/storage";

type StoredAdminUser = {
  id: string;
  email: string;
  tenant_id: string;
  role?: string;
};

export default function AdminAuthGuard() {
  const location = useLocation();

  const accessToken = getAccessToken();
  const user = getStoredUser<StoredAdminUser>();

  if (!accessToken || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (user.role === "supplier") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}