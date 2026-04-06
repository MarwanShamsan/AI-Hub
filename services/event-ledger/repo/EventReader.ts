import { Pool } from "pg";

export type LedgerRow = {
  seq: number;
  id: string;
  deal_id: string;
  stream_seq: number;
  event_type: string;
  actor_type: string;
  actor_id: string;
  agent_id: number | null;
  payload: any;
  prev_hash: string | null;
  hash: string;
  created_at: string;
};

export class EventReader {
  constructor(private pool: Pool) {}

  async readFromSeq(afterSeq: number, limit = 500): Promise<LedgerRow[]> {
    const res = await this.pool.query(
      `SELECT seq, id, deal_id, stream_seq, event_type, actor_type, actor_id, agent_id,
              payload, prev_hash, hash, created_at
       FROM events
       WHERE seq > $1
       ORDER BY seq ASC
       LIMIT $2`,
      [afterSeq, limit]
    );

    return res.rows.map((r) => ({
      seq: Number(r.seq),
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
    }));
  }
}
