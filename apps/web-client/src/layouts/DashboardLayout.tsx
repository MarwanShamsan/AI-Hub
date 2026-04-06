import { Link, Outlet, useNavigate } from "react-router-dom";
import { clearSessionStorage } from "../lib/storage";

export default function DashboardLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    clearSessionStorage();
    navigate("/", { replace: true });
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <h2>AI Hub</h2>
        <nav className="nav-list">
          <Link to="/app">Dashboard</Link>
          <Link to="/app/requests/new">New Request</Link>
          <Link to="/app/discovery">Discovery</Link>
          <Link to="/app/deals">Deals</Link>
          <Link to="/app/disputes">Disputes</Link>
          <Link to="/app/certificates">Certificates</Link>
        </nav>

        <button className="button" type="button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}