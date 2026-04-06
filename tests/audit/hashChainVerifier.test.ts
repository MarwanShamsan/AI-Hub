import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  verifyDealHashChain,
  verifyFullLedgerPerDeal
} from "../../ai-core/audit/hashChainVerifier";
import { computeEventHash } from "../../shared/crypto/hashChain";
import { StoredEvent } from "../../ai-core/events/types";

function makeEvent(params: {
  deal_id: string;
  stream_seq: number;
  prev_hash: string | null;
  event_type?: string;
  payload?: unknown;
}): StoredEvent {
  const base = {
    id: randomUUID(),
    deal_id: params.deal_id,
    stream_seq: params.stream_seq,
    event_type: params.event_type ?? "TEST_EVENT",
    actor_type: "SYSTEM" as const,
    actor_id: "system-test",
    agent_id: null,
    payload: params.payload ?? { ok: true },
    prev_hash: params.prev_hash,
    created_at: new Date("2026-01-01T00:00:00.000Z").toISOString()
  };

  const hash = computeEventHash(base.prev_hash, base);

  return {
    ...base,
    hash
  };
}

test("verifyDealHashChain => VALID for correct chain", () => {
  const dealId = randomUUID();

  const e1 = makeEvent({ deal_id: dealId, stream_seq: 1, prev_hash: null });
  const e2 = makeEvent({ deal_id: dealId, stream_seq: 2, prev_hash: e1.hash });
  const e3 = makeEvent({ deal_id: dealId, stream_seq: 3, prev_hash: e2.hash });

  const result = verifyDealHashChain([e1, e2, e3], dealId);

  assert.equal(result.status, "VALID");
  assert.equal(result.checked_events, 3);
});

test("verifyDealHashChain => INVALID on tampered payload", () => {
  const dealId = randomUUID();

  const e1 = makeEvent({ deal_id: dealId, stream_seq: 1, prev_hash: null });
  const e2 = makeEvent({ deal_id: dealId, stream_seq: 2, prev_hash: e1.hash });

  const tampered: StoredEvent = {
    ...e2,
    payload: { ok: false, tampered: true }
  };

  const result = verifyDealHashChain([e1, tampered], dealId);

  assert.equal(result.status, "INVALID");
  assert.equal(result.first_error?.code, "HASH_MISMATCH");
});

test("verifyDealHashChain => INVALID on broken prev_hash linkage", () => {
  const dealId = randomUUID();

  const e1 = makeEvent({ deal_id: dealId, stream_seq: 1, prev_hash: null });
  const e2 = makeEvent({
    deal_id: dealId,
    stream_seq: 2,
    prev_hash: "broken-prev-hash"
  });

  const result = verifyDealHashChain([e1, e2], dealId);

  assert.equal(result.status, "INVALID");
  assert.equal(result.first_error?.code, "PREV_HASH_MISMATCH");
});

test("verifyDealHashChain => INVALID on reordered/non-contiguous stream_seq", () => {
  const dealId = randomUUID();

  const e1 = makeEvent({ deal_id: dealId, stream_seq: 1, prev_hash: null });
  const e3 = makeEvent({ deal_id: dealId, stream_seq: 3, prev_hash: e1.hash });

  const result = verifyDealHashChain([e1, e3], dealId);

  assert.equal(result.status, "INVALID");
  assert.equal(result.first_error?.code, "STREAM_SEQ_MISMATCH");
});

test("verifyFullLedgerPerDeal => INVALID when one deal is corrupted", async () => {
  const dealA = randomUUID();
  const dealB = randomUUID();

  const a1 = makeEvent({ deal_id: dealA, stream_seq: 1, prev_hash: null });
  const a2 = makeEvent({ deal_id: dealA, stream_seq: 2, prev_hash: a1.hash });

  const b1 = makeEvent({ deal_id: dealB, stream_seq: 1, prev_hash: null });
  const b2 = {
    ...makeEvent({ deal_id: dealB, stream_seq: 2, prev_hash: b1.hash }),
    hash: "tampered-hash"
  };

  const streams = new Map<string, StoredEvent[]>([
    [dealA, [a1, a2]],
    [dealB, [b1, b2]]
  ]);

  const result = await verifyFullLedgerPerDeal(
    [dealA, dealB],
    async (dealId) => streams.get(dealId) ?? []
  );

  assert.equal(result.status, "INVALID");
  assert.equal(result.first_invalid_deal_id, dealB);
  assert.equal(result.first_error?.code, "HASH_MISMATCH");
});