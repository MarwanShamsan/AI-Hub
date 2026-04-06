import { Pool } from "pg";
import { EventStore } from "../../event-ledger/repo/EventStore";
import { StoredEvent } from "../../../ai-core/events/types";

export type EngineHandler = (ev: StoredEvent) => Promise<void>;

export class EngineRunner {
  constructor(
    private pool: Pool,
    private engineName: string,
    private handler: EngineHandler
  ) {}

  async startForever(opts?: { batchSize?: number; pollMs?: number }) {
    const batchSize = opts?.batchSize ?? 200;
    const pollMs = opts?.pollMs ?? 500;

    // Ensure checkpoint row exists
    await this.pool.query(
      `INSERT INTO engine_checkpoints (engine_name, last_seq)
       VALUES ($1, 0)
       ON CONFLICT (engine_name) DO NOTHING`,
      [this.engineName]
    );

    // Main loop
    for (;;) {
      const lastSeqRes = await this.pool.query(
        `SELECT last_seq FROM engine_checkpoints WHERE engine_name=$1`,
        [this.engineName]
      );
      const lastSeq = Number(lastSeqRes.rows[0]?.last_seq ?? 0);

      const res = await this.pool.query(
        `SELECT seq, id, deal_id, stream_seq, event_type, actor_type, actor_id, agent_id, payload, prev_hash, hash, created_at
         FROM events
         WHERE seq > $1
         ORDER BY seq ASC
         LIMIT $2`,
        [lastSeq, batchSize]
      );

      if (res.rowCount === 0) {
        await new Promise(r => setTimeout(r, pollMs));
        continue;
      }

      for (const r of res.rows) {
        const ev: StoredEvent & { seq?: number } = {
          id: r.id,
          deal_id: r.deal_id,
          stream_seq: Number(r.stream_seq),
          event_type: r.event_type,
          actor_type: r.actor_type,
          actor_id: r.actor_id,
          agent_id: r.agent_id === null ? null : Number(r.agent_id),
          payload: r.payload,
          prev_hash: r.prev_hash,
          hash: r.hash,
          created_at: new Date(r.created_at).toISOString(),
        };

        // Handle event
        await this.handler(ev);

        // Advance checkpoint AFTER successful handling (allowed UPDATE)
        await this.pool.query(
          `UPDATE engine_checkpoints
           SET last_seq=$2, updated_at=now()
           WHERE engine_name=$1`,
          [this.engineName, Number(r.seq)]
        );
      }
    }
  }
}
