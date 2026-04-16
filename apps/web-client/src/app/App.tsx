import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  clearSessionStorage,
  getAccessToken,
  setStoredUser
} from "../lib/storage";
import { authApi } from "../features/auth/api";
import { AuthUser } from "../features/auth/types";
import { useI18n } from "../i18n/useI18n";

export default function App() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrapSession() {
      const accessToken = getAccessToken();

      if (!accessToken) {
        setBootstrapping(false);
        return;
      }

      try {
        const data = (await authApi.me()) as AuthUser;
        setStoredUser(data);
      } catch {
        clearSessionStorage();
        navigate("/", { replace: true });
      } finally {
        setBootstrapping(false);
      }
    }

    void bootstrapSession();
  }, [navigate]);

  if (bootstrapping) {
    return <div style={{ padding: "24px" }}>{t("common.loading")}</div>;
  }

  return <Outlet />;
}