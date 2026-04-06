import type { Deal } from "../../types/api";

export function DealTimeline({ deal }: { deal: Deal }) {
  const items = [
    "DEAL_CREATED",
    deal.inspection_passed ? "INSPECTION_PASSED" : null,
    deal.token_a_issued ? "TOKEN_A_ISSUED" : null,
    deal.shipment_verified ? "SHIPMENT_VERIFIED" : null,
    deal.token_b_issued ? "TOKEN_B_ISSUED" : null,
    deal.timer_started ? "TIMER_STARTED" : null,
    deal.timer_expired ? "TIMER_EXPIRED" : null,
    deal.dispute_open ? "DISPUTE_OPENED" : null,
    deal.token_c_issued ? "TOKEN_C_ISSUED" : null,
    deal.deal_closed ? "DEAL_CLOSED" : null
  ].filter(Boolean) as string[];

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Derived Timeline</h3>
      <ul style={{ marginBottom: 0 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}