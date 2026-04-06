import { Pool } from "pg";
import { StoredEvent } from "../../../ai-core/events/types";

export class LedgerAuditRepo {
  constructor(private pool: Pool) {}

  async listDealIds(): Promise<string[]> {
    const res = await this.pool.query(
      `SELECT DISTINCT deal_id
       FROM events
       ORDER BY deal_id ASC`
    );

    return res.rows.map((r) => r.deal_id as string);
  }

  async loadDealEvents(dealId: string): Promise<StoredEvent[]> {
    const res = await this.pool.query(
      `SELECT id, deal_id, stream_seq, event_type, actor_type, actor_id, agent_id,
              payload, prev_hash, hash, created_at
       FROM events
       WHERE deal_id = $1
       ORDER BY stream_seq ASC`,
      [dealId]
    );

    return res.rows.map((r) => ({
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
      created_at: new Date(r.created_at).toISOString()
    }));
  }
}