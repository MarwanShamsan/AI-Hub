import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, getSessionUser } from "../features/auth/session";
import { useI18n } from "../i18n";

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export function AppLayout() {
  const user = getSessionUser();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">AI</div>

            <div>
              <h2>{t("app.name")}</h2>
              <p className="sidebar-brand-text">{t("app.tagline")}</p>
            </div>
          </div>

          <div className="locale-switcher">
            <label htmlFor="supplier-locale">{t("locale.label")}</label>
            <select
              id="supplier-locale"
              className="locale-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "ar")}
            >
              <option value="en">{t("locale.english")}</option>
              <option value="ar">{t("locale.arabic")}</option>
            </select>
          </div>

          <nav className="nav-list">
            <NavLink to="/app" end className={navClassName}>
              {t("nav.dashboard")}
            </NavLink>
            <NavLink to="/app/profile" className={navClassName}>
              {t("nav.profile")}
            </NavLink>
            <NavLink to="/app/documents" className={navClassName}>
              {t("nav.documents")}
            </NavLink>
            <NavLink to="/app/qualification" className={navClassName}>
              {t("nav.qualification")}
            </NavLink>
            <NavLink to="/app/contracts" className={navClassName}>
              {t("nav.contracts")}
            </NavLink>
            <NavLink to="/app/inspection" className={navClassName}>
              {t("nav.inspection")}
            </NavLink>
            <NavLink to="/app/shipment" className={navClassName}>
              {t("nav.shipment")}
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-panel">
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{user?.email}</div>
              <div className="sidebar-brand-text">{t("nav.supplierAccount")}</div>
            </div>

            <button
              className="button sidebar-logout"
              onClick={() => {
                clearSession();
                navigate("/login", { replace: true });
              }}
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}