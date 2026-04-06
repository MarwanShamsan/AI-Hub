import type { Deal } from "../../types/api";

export function DealLifecycle({ deal }: { deal: Deal }) {
  const steps = [
    { label: "Created", active: true },
    { label: "Inspection Passed", active: deal.inspection_passed },
    { label: "Token A Issued", active: deal.token_a_issued },
    { label: "Shipment Verified", active: deal.shipment_verified },
    { label: "Token B Issued", active: deal.token_b_issued },
    { label: "Timer Started", active: deal.timer_started },
    { label: "Timer Expired", active: deal.timer_expired },
    { label: "Token C Issued", active: deal.token_c_issued },
    { label: "Deal Closed", active: deal.deal_closed }
  ];

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {steps.map((step) => (
        <Step key={step.label} label={step.label} active={step.active} />
      ))}
    </div>
  );
}

function Step({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid #ccc",
        background: active ? "#e8f5e9" : "#f7f7f7",
        fontWeight: active ? 700 : 400
      }}
    >
      {label}
    </div>
  );
}