import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSessionStorage } from "../lib/storage";
import { useI18n } from "../i18n/useI18n";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { locale, setLocale, t } = useI18n();

  function handleLogout() {
    clearSessionStorage();
    navigate("/", { replace: true });
  }

  const navItems = [
    { to: "/app", label: t("layout.nav.dashboard"), end: true },
    { to: "/app/requests", label: t("layout.nav.myRequests") },
    { to: "/app/requests/new", label: t("layout.nav.newRequest") },
    { to: "/app/discovery", label: t("layout.nav.discovery") },
    { to: "/app/deals", label: t("layout.nav.deals") },
    { to: "/app/disputes", label: t("layout.nav.disputes") },
    { to: "/app/certificates", label: t("layout.nav.certificates") }
  ];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-panel">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">AI</div>
            <div>
              <h2>{t("layout.appName")}</h2>
              <p className="sidebar-brand-text">{t("layout.workspaceTagline")}</p>
            </div>
          </div>

          <div className="locale-switcher">
            <label htmlFor="locale-select">{t("common.language")}</label>
            <select
              id="locale-select"
              className="locale-select"
              value={locale}
              onChange={(event) =>
                setLocale(event.target.value === "ar" ? "ar" : "en")
              }
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <nav className="nav-list">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="button sidebar-logout" type="button" onClick={handleLogout}>
            {t("common.logout")}
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}