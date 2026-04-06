import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { queryClient } from "../../services/query-client";
import type { Deal, Timer } from "../../types/api";
import { DealLifecycle } from "../../components/deals/DealLifecycle";
import { DealTimeline } from "../../components/deals/DealTimeline";
import { TimerCard } from "../../components/deals/TimerCard";

export default function DealDetailsPage() {
  const { dealId } = useParams<{ dealId: string }>();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [timer, setTimer] = useState<Timer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!dealId) {
        setError("Missing deal id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const dealRes = await queryClient.getDeal(dealId);
        if (!active) return;
        setDeal(dealRes.deal);

        try {
          const timerRes = await queryClient.getTimer(dealId);
          if (!active) return;
          setTimer(timerRes.timer);
        } catch {
          if (!active) return;
          setTimer(null);
        }
      } catch (e: any) {
        if (!active) return;
        setError(e.message || "Failed to load deal details");
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
  }, [dealId]);

  if (loading) {
    return <div>Loading deal details...</div>;
  }

  if (error) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Link to="/app/deals">← Back to deals</Link>
        <div style={{ padding: 12, border: "1px solid #d33", color: "#d33" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <Link to="/app/deals">← Back to deals</Link>
        <div>Deal not found.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <Link to="/app/deals">← Back to deals</Link>
        <h1 style={{ margin: 0 }}>{deal.deal_title}</h1>
        <div>Status: {deal.status}</div>
        <div>Last Event: {deal.last_event_type}</div>
        <div>Last Event At: {formatDateTime(deal.last_event_at)}</div>
        <div>Updated At: {formatDateTime(deal.updated_at)}</div>
      </div>

      <section style={{ border: "1px solid #ddd", padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Lifecycle</h2>
        <DealLifecycle deal={deal} />
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Deal Summary</h2>
        <SummaryRow label="Deal ID" value={deal.deal_id} />
        <SummaryRow label="Buyer ID" value={deal.buyer_id} />
        <SummaryRow label="Supplier ID" value={deal.supplier_id} />
        <SummaryRow label="Currency" value={deal.currency} />
        <SummaryRow label="Inspection Passed" value={toYesNo(deal.inspection_passed)} />
        <SummaryRow label="Shipment Verified" value={toYesNo(deal.shipment_verified)} />
        <SummaryRow label="Dispute Open" value={toYesNo(deal.dispute_open)} />
        <SummaryRow label="Deal Closed" value={toYesNo(deal.deal_closed)} />
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Tokens</h2>
        <SummaryRow label="Token A Issued" value={toYesNo(deal.token_a_issued)} />
        <SummaryRow label="Token B Issued" value={toYesNo(deal.token_b_issued)} />
        <SummaryRow label="Token C Issued" value={toYesNo(deal.token_c_issued)} />
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16 }}>
        <TimerCard timer={timer} />
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16 }}>
        <DealTimeline deal={deal} />
      </section>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "4px 0" }}>
      <strong style={{ minWidth: 180 }}>{label}:</strong>
      <span>{value}</span>
    </div>
  );
}

function toYesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}