import type { Timer } from "../../types/api";

export function TimerCard({ timer }: { timer: Timer | null }) {
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Timer</h3>

      {!timer ? (
        <p>No timer projection available for this deal.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <Row label="State" value={timer.state || "—"} />
          <Row label="Started At" value={formatDateTime(timer.started_at)} />
          <Row label="Expires At" value={formatDateTime(timer.expires_at)} />
          <Row label="Expired At" value={formatDateTime(timer.expired_at)} />
          <Row label="Updated At" value={formatDateTime(timer.updated_at)} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <strong style={{ minWidth: 140 }}>{label}:</strong>
      <span>{value}</span>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}