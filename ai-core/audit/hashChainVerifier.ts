import { computeEventHash } from "../../shared/crypto/hashChain";
import { StoredEvent } from "../events/types";

export type HashChainFailureCode =
  | "NO_EVENTS"
  | "STREAM_SEQ_MISMATCH"
  | "GENESIS_PREV_HASH_NOT_NULL"
  | "PREV_HASH_MISMATCH"
  | "HASH_MISMATCH";

export type HashChainFailure = {
  event_id: string;
  deal_id: string;
  stream_seq: number;
  event_type: string;
  code: HashChainFailureCode;
  reason: string;
  expected?: string | number | null;
  actual?: string | number | null;
};

export type DealVerificationResult = {
  status: "VALID" | "INVALID";
  mode: "deal";
  deal_id: string;
  checked_events: number;
  first_error?: HashChainFailure;
};

export type FullLedgerVerificationResult = {
  status: "VALID" | "INVALID";
  mode: "full-ledger";
  checked_deals: number;
  checked_events: number;
  first_invalid_deal_id?: string;
  first_error?: HashChainFailure;
  invalid_deals: Array<{
    deal_id: string;
    checked_events: number;
    first_error: HashChainFailure;
  }>;
};

function buildEventWithoutHash(event: StoredEvent) {
  return {
    id: event.id,
    deal_id: event.deal_id,
    stream_seq: event.stream_seq,
    event_type: event.event_type,
    actor_type: event.actor_type,
    actor_id: event.actor_id,
    agent_id: event.agent_id,
    payload: event.payload,
    prev_hash: event.prev_hash,
    created_at: event.created_at
  };
}

export function verifyDealHashChain(events: StoredEvent[], dealId?: string): DealVerificationResult {
  const resolvedDealId = dealId ?? events[0]?.deal_id ?? "UNKNOWN_DEAL";

  if (events.length === 0) {
    return {
      status: "INVALID",
      mode: "deal",
      deal_id: resolvedDealId,
      checked_events: 0,
      first_error: {
        event_id: "N/A",
        deal_id: resolvedDealId,
        stream_seq: 0,
        event_type: "N/A",
        code: "NO_EVENTS",
        reason: "No events found for deal stream"
      }
    };
  }

  for (let i = 0; i < events.length; i++) {
    const current = events[i];
    const previous = i > 0 ? events[i - 1] : null;
    const expectedStreamSeq = i + 1;

    if (current.stream_seq !== expectedStreamSeq) {
      return {
        status: "INVALID",
        mode: "deal",
        deal_id: current.deal_id,
        checked_events: i,
        first_error: {
          event_id: current.id,
          deal_id: current.deal_id,
          stream_seq: current.stream_seq,
          event_type: current.event_type,
          code: "STREAM_SEQ_MISMATCH",
          reason: "Event stream sequence is not contiguous or is reordered",
          expected: expectedStreamSeq,
          actual: current.stream_seq
        }
      };
    }

    if (previous === null) {
      if (current.prev_hash !== null) {
        return {
          status: "INVALID",
          mode: "deal",
          deal_id: current.deal_id,
          checked_events: i,
          first_error: {
            event_id: current.id,
            deal_id: current.deal_id,
            stream_seq: current.stream_seq,
            event_type: current.event_type,
            code: "GENESIS_PREV_HASH_NOT_NULL",
            reason: "Genesis event must have prev_hash = null",
            expected: null,
            actual: current.prev_hash
          }
        };
      }
    } else {
      if (current.prev_hash !== previous.hash) {
        return {
          status: "INVALID",
          mode: "deal",
          deal_id: current.deal_id,
          checked_events: i,
          first_error: {
            event_id: current.id,
            deal_id: current.deal_id,
            stream_seq: current.stream_seq,
            event_type: current.event_type,
            code: "PREV_HASH_MISMATCH",
            reason: "Event prev_hash does not match predecessor hash",
            expected: previous.hash,
            actual: current.prev_hash
          }
        };
      }
    }

    const recomputedHash = computeEventHash(
      current.prev_hash,
      buildEventWithoutHash(current)
    );

    if (recomputedHash !== current.hash) {
      return {
        status: "INVALID",
        mode: "deal",
        deal_id: current.deal_id,
        checked_events: i,
        first_error: {
          event_id: current.id,
          deal_id: current.deal_id,
          stream_seq: current.stream_seq,
          event_type: current.event_type,
          code: "HASH_MISMATCH",
          reason: "Stored hash does not match recomputed canonical event hash",
          expected: recomputedHash,
          actual: current.hash
        }
      };
    }
  }

  return {
    status: "VALID",
    mode: "deal",
    deal_id: resolvedDealId,
    checked_events: events.length
  };
}

export async function verifyFullLedgerPerDeal(
  dealIds: string[],
  loadDealEvents: (dealId: string) => Promise<StoredEvent[]>
): Promise<FullLedgerVerificationResult> {
  const invalidDeals: FullLedgerVerificationResult["invalid_deals"] = [];
  let checkedEvents = 0;

  for (const dealId of dealIds) {
    const events = await loadDealEvents(dealId);
    const result = verifyDealHashChain(events, dealId);
    checkedEvents += result.checked_events;

    if (result.status === "INVALID" && result.first_error) {
      invalidDeals.push({
        deal_id: dealId,
        checked_events: result.checked_events,
        first_error: result.first_error
      });
    }
  }

  if (invalidDeals.length > 0) {
    return {
      status: "INVALID",
      mode: "full-ledger",
      checked_deals: dealIds.length,
      checked_events: checkedEvents,
      first_invalid_deal_id: invalidDeals[0].deal_id,
      first_error: invalidDeals[0].first_error,
      invalid_deals: invalidDeals
    };
  }

  return {
    status: "VALID",
    mode: "full-ledger",
    checked_deals: dealIds.length,
    checked_events: checkedEvents,
    invalid_deals: []
  };
}