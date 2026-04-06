import { Pool } from "pg";
import { EventStore } from "../../event-ledger/repo/EventStore";
import { StoredEvent, NewCommand } from "../../../ai-core/events/types";
import { validateCommand } from "../../../ai-core/policy/validate";

const H168_MS = 168 * 60 * 60 * 1000;

function addMs(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString();
}

export class TimeArbiterEngine {
  constructor(
    private pool: Pool,
    private store: EventStore,
    private catalog: any,
    private authority: any
  ) {}

  async onEvent(ev: StoredEvent) {
    if (ev.event_type !== "GOODS_RECEIVED") return;

    const dealId = ev.deal_id;
    const events = await this.store.loadDealEvents(dealId);

    if (events.some(e => e.event_type === "TIMER_STARTED")) return;
    if (events.some(e => e.event_type === "DEAL_CLOSED")) return;

    const started_at = ev.created_at;
    const expires_at = addMs(started_at, H168_MS);

    const cmd: NewCommand = {
      deal_id: dealId,
      event_type: "TIMER_STARTED",
      actor: {
        actor_type: "AGENT",
        actor_id: "agent-8-time-arbiter",
        agent_id: 8
      },
      payload: {
        started_at,
        expires_at,
        basis_event_id: ev.id
      }
    };

    const reject = validateCommand(this.catalog, this.authority, cmd, events);
    if (reject) throw new Error(reject.message);

    await this.store.appendIfAbsentEventType(cmd, "TIMER_STARTED");
  }

    async tickExpireDueTimers(batchSize = 200) {
    const client = await this.pool.connect();

    let emitted = 0;
    let skippedClosed = 0;
    let skippedAlreadyExpired = 0;

    try {
      await client.query("BEGIN");

      const res = await client.query(
        `
        SELECT deal_id
        FROM views.timer_index
        WHERE state = 'RUNNING'
          AND expires_at IS NOT NULL
          AND expires_at <= now()
        ORDER BY expires_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
        `,
        [batchSize]
      );

      await client.query("COMMIT");

      for (const row of res.rows) {
        const dealId = row.deal_id as string;

        const events = await this.store.loadDealEvents(dealId);

        if (events.some(e => e.event_type === "DEAL_CLOSED")) {
          skippedClosed++;
          continue;
        }

        if (events.some(e => e.event_type === "TIMER_EXPIRED")) {
          skippedAlreadyExpired++;
          continue;
        }

        const timerStarted = events
          .filter(e => e.event_type === "TIMER_STARTED")
          .sort((a, b) => a.stream_seq - b.stream_seq)
          .pop();

        if (!timerStarted) continue;

        const expires_at = (timerStarted.payload as any)?.expires_at;
        if (!expires_at) continue;

        const cmd: NewCommand = {
          deal_id: dealId,
          event_type: "TIMER_EXPIRED",
          actor: {
            actor_type: "AGENT",
            actor_id: "agent-8-time-arbiter",
            agent_id: 8
          },
          payload: {
            expired_at: expires_at
          }
        };

        const reject = validateCommand(this.catalog, this.authority, cmd, events);
        if (reject) throw new Error(reject.message);

        const result = await this.store.appendIfAbsentEventType(cmd, "TIMER_EXPIRED");
        if (result) emitted++;
      }

      return {
        scanned: res.rows.length,
        emitted,
        skippedClosed,
        skippedAlreadyExpired
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // ignore rollback failure
      }
      throw error;
    } finally {
      client.release();
    }
  }
}