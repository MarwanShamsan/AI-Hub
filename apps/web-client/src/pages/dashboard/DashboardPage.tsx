import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { queryClient } from "../../services/query-client";
import type { Deal } from "../../types/api";

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await queryClient.getDeals();
        if (!active) return;
        setDeals(res.deals ?? []);
      } catch (e: any) {
        if (!active) return;
        setError(e.message || "Failed to load dashboard");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: deals.length,
      inTransit: deals.filter((d) => d.status === "IN_TRANSIT").length,
      disputed: deals.filter((d) => d.dispute_open).length,
      completed: deals.filter((d) => d.deal_closed).length
    }),
    [deals]
  );

  const recentDeals = deals.slice(0, 5);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Dashboard</h1>
        <p>Read-only derived deal overview from sovereign query projections.</p>
      </div>

      {loading && <div>Loading dashboard...</div>}

      {error && (
        <div style={{ padding: 12, border: "1px solid #d33", color: "#d33" }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Stat label="Total Deals" value={stats.total} />
            <Stat label="In Transit" value={stats.inTransit} />
            <Stat label="Disputed" value={stats.disputed} />
            <Stat label="Completed" value={stats.completed} />
          </div>

          <section style={{ border: "1px solid #ddd", padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12
              }}
            >
              <h2 style={{ margin: 0 }}>Recent Deals</h2>
              <Link to="/app/deals">View all deals</Link>
            </div>

            {recentDeals.length === 0 ? (
              <div>No deals found.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {recentDeals.map((deal) => (
                  <Link
                    key={deal.deal_id}
                    to={`/app/deals/${deal.deal_id}`}
                    style={{
                      display: "block",
                      border: "1px solid #ddd",
                      padding: 12,
                      textDecoration: "none",
                      color: "inherit"
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{deal.deal_title}</div>
                    <div>Status: {deal.status}</div>
                    <div>Last Event: {deal.last_event_type}</div>
                    <div>Updated At: {formatDateTime(deal.updated_at)}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ minWidth: 180, padding: 20, border: "1px solid #ccc" }}>
      <h3 style={{ marginTop: 0 }}>{label}</h3>
      <strong style={{ fontSize: 24 }}>{value}</strong>
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}