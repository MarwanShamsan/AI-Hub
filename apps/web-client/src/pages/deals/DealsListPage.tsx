import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { queryClient } from "../../services/query-client";
import type { Deal } from "../../types/api";

export default function DealsListPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

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
        setError(e.message || "Failed to load deals");
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

  const statuses = useMemo(() => {
    const values = Array.from(new Set(deals.map((d) => d.status))).sort();
    return ["ALL", ...values];
  }, [deals]);

  const filteredDeals = useMemo(() => {
    if (statusFilter === "ALL") return deals;
    return deals.filter((deal) => deal.status === statusFilter);
  }, [deals, statusFilter]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1>Deals</h1>
        <p>Read-only deal list from `GET /deals` query projection.</p>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label htmlFor="deal-status-filter">Status</label>
        <select
          id="deal-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading && <div>Loading deals...</div>}

      {error && (
        <div style={{ padding: 12, border: "1px solid #d33", color: "#d33" }}>
          {error}
        </div>
      )}

      {!loading && !error && filteredDeals.length === 0 && (
        <div style={{ padding: 12, border: "1px solid #ddd" }}>
          No deals found.
        </div>
      )}

      {!loading && !error && filteredDeals.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredDeals.map((deal) => (
            <Link
              key={deal.deal_id}
              to={`/app/deals/${deal.deal_id}`}
              style={{
                display: "block",
                border: "1px solid #ccc",
                padding: 16,
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <strong>{deal.deal_title}</strong>
                <span>Status: {deal.status}</span>
                <span>Supplier: {deal.supplier_id}</span>
                <span>Currency: {deal.currency}</span>
                <span>Last Event: {deal.last_event_type}</span>
                <span>Updated At: {formatDateTime(deal.updated_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}