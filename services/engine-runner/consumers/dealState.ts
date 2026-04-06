import { StoredEvent } from "../../../ai-core/events/types";

export type DealState = {
  has: Set<string>;
  lastInspection?: "PASSED" | "FAILED";
  lastShipment?: "VERIFIED" | "REJECTED";
  timerStarted?: { started_at: string; expires_at: string };
  timerExpiredAt?: string;
  disputeOpen?: boolean;
};

export function buildDealState(events: StoredEvent[]): DealState {
  const has = new Set<string>();
  const state: DealState = { has };

  // Track disputes as: OPEN unless RESOLVED/REJECTED occurs after opening
  let disputeOpenedSeq: number | null = null;
  let disputeClosedSeq: number | null = null;

  for (const ev of events) {
    has.add(ev.event_type);

    if (ev.event_type === "INSPECTION_PASSED") state.lastInspection = "PASSED";
    if (ev.event_type === "INSPECTION_FAILED") state.lastInspection = "FAILED";

    if (ev.event_type === "SHIPMENT_VERIFIED") state.lastShipment = "VERIFIED";
    if (ev.event_type === "SHIPMENT_REJECTED") state.lastShipment = "REJECTED";

    if (ev.event_type === "TIMER_STARTED") {
      const started_at = String((ev.payload as any)?.started_at ?? "");
      const expires_at = String((ev.payload as any)?.expires_at ?? "");
      if (started_at && expires_at) {
        state.timerStarted = { started_at, expires_at };
      }
    }

    if (ev.event_type === "TIMER_EXPIRED") {
      state.timerExpiredAt = String((ev.payload as any)?.expired_at ?? ev.created_at);
    }

    if (ev.event_type === "DISPUTE_OPENED") disputeOpenedSeq = ev.stream_seq;

    if (ev.event_type === "DISPUTE_RESOLVED" || ev.event_type === "DISPUTE_REJECTED") {
      disputeClosedSeq = ev.stream_seq;
    }
  }

  state.disputeOpen =
    disputeOpenedSeq !== null &&
    (disputeClosedSeq === null || disputeClosedSeq < disputeOpenedSeq);

  return state;
}