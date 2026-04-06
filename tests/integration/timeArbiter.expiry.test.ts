import { strict as assert } from "assert";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { EventStore } from "../../services/event-ledger/repo/EventStore";
import { TimeArbiterEngine } from "../../services/engine-runner/consumers/timeArbiterEngine";
import { loadCatalog, loadAuthorityMatrix } from "../../services/config/loadPolicy";

describe("TimeArbiter Expiry", () => {
  it("emits TIMER_EXPIRED exactly once and deterministically", async () => {
    const connectionString = process.env.TEST_DB;
    if (!connectionString) {
      throw new Error("Missing TEST_DB");
    }

    const policyDir = process.env.POLICY_DIR ?? "./policy";
    const catalog = loadCatalog(policyDir);
    const matrix = loadAuthorityMatrix(policyDir);

    const pool = new Pool({ connectionString });
    const store = new EventStore(pool);
    const engine = new TimeArbiterEngine(pool, store, catalog, matrix);

    const dealId = randomUUID();

    // 1) Create deal + GOODS_RECEIVED
    await store.append({
      deal_id: dealId,
      event_type: "GOODS_RECEIVED",
      actor: {
        actor_type: "AGENT",
        actor_id: "test",
        agent_id: 7
      },
      payload: {}
    });

    // 2) Trigger TIMER_STARTED
    const events = await store.loadDealEvents(dealId);
    await engine.onEvent(events[0]);

    // 3) Force expiration into past (projection only)
    await pool.query(
      `
      UPDATE views.timer_index
      SET expires_at = now() - interval '1 hour'
      WHERE deal_id = $1
      `,
      [dealId]
    );

    // 4) Run tick twice
    await engine.tickExpireDueTimers();
    await engine.tickExpireDueTimers();

    const finalEvents = await store.loadDealEvents(dealId);
    const expired = finalEvents.filter((e) => e.event_type === "TIMER_EXPIRED");

    assert.equal(expired.length, 1);

    const started = finalEvents.find((e) => e.event_type === "TIMER_STARTED");

    assert.equal(
      (expired[0].payload as any).expired_at,
      (started?.payload as any)?.expires_at
    );

    await pool.end();
  });
});