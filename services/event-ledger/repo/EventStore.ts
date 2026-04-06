import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { computeEventHash } from "../../../shared/crypto/hashChain";
import { nowUtcIso } from "../../../shared/time/utc";
import { NewCommand, StoredEvent } from "../../../ai-core/events/types";

export class EventStore {
  constructor(private pool: Pool) {}

  async loadDealEvents(dealId: string): Promise<StoredEvent[]> {
    const res = await this.pool.query(
      `SELECT id, deal_id, stream_seq, event_type, actor_type, actor_id, agent_id, payload, prev_hash, hash, created_at
       FROM events WHERE deal_id=$1 ORDER BY stream_seq ASC`,
      [dealId]
    );
    return res.rows.map(r => ({
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

  /**
   * Append ONE event transactionally, with per-deal serialization.
   * No UPDATE/DELETE. Only INSERT.
   */
  async append(cmd: NewCommand): Promise<StoredEvent> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // serialize per deal
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [cmd.deal_id]);

      const head = await client.query(
        `SELECT stream_seq, hash FROM events WHERE deal_id=$1 ORDER BY stream_seq DESC LIMIT 1`,
        [cmd.deal_id]
      );

      const prevStreamSeq = head.rows[0]?.stream_seq ? Number(head.rows[0].stream_seq) : 0;
      const prevHash = head.rows[0]?.hash ?? null;

      const id = randomUUID();
      const created_at = nowUtcIso();
      const stream_seq = prevStreamSeq + 1;

      const eventWithoutHash = {
        id,
        deal_id: cmd.deal_id,
        stream_seq,
        event_type: cmd.event_type,
        actor_type: cmd.actor.actor_type,
        actor_id: cmd.actor.actor_id,
        agent_id: cmd.actor.agent_id,
        payload: cmd.payload,
        prev_hash: prevHash,
        created_at
      };

      const hash = computeEventHash(prevHash, eventWithoutHash);

      const inserted = await client.query(
        `INSERT INTO events (id, deal_id, stream_seq, event_type, actor_type, actor_id, agent_id, payload, prev_hash, hash, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, deal_id, stream_seq, event_type, actor_type, actor_id, agent_id, payload, prev_hash, hash, created_at`,
        [
          id, cmd.deal_id, stream_seq, cmd.event_type,
          cmd.actor.actor_type, cmd.actor.actor_id, cmd.actor.agent_id,
          cmd.payload, prevHash, hash, created_at
        ]
      );

      await client.query("COMMIT");

      const r = inserted.rows[0];
      return {
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
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Append event IF an event_type is absent for this deal.
   * Strong idempotency across multiple engine instances.
   * Returns StoredEvent if inserted, otherwise null if already exists.
   */
  async appendIfAbsentEventType(cmd: NewCommand, uniqueEventType: string): Promise<StoredEvent | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // serialize per deal
      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [cmd.deal_id]);

      // strong idempotency check inside the same transaction
      const exists = await client.query(
        `SELECT 1 FROM events WHERE deal_id=$1 AND event_type=$2 LIMIT 1`,
        [cmd.deal_id, uniqueEventType]
      );

      if ((exists.rowCount ?? 0) > 0) {
        await client.query("COMMIT");
        return null;
      }

      const head = await client.query(
        `SELECT stream_seq, hash FROM events WHERE deal_id=$1 ORDER BY stream_seq DESC LIMIT 1`,
        [cmd.deal_id]
      );

      const prevStreamSeq = head.rows[0]?.stream_seq ? Number(head.rows[0].stream_seq) : 0;
      const prevHash = head.rows[0]?.hash ?? null;

      const id = randomUUID();
      const created_at = nowUtcIso();
      const stream_seq = prevStreamSeq + 1;

      const eventWithoutHash = {
        id,
        deal_id: cmd.deal_id,
        stream_seq,
        event_type: cmd.event_type,
        actor_type: cmd.actor.actor_type,
        actor_id: cmd.actor.actor_id,
        agent_id: cmd.actor.agent_id,
        payload: cmd.payload,
        prev_hash: prevHash,
        created_at
      };

      const hash = computeEventHash(prevHash, eventWithoutHash);

      const inserted = await client.query(
        `INSERT INTO events (id, deal_id, stream_seq, event_type, actor_type, actor_id, agent_id, payload, prev_hash, hash, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id, deal_id, stream_seq, event_type, actor_type, actor_id, agent_id, payload, prev_hash, hash, created_at`,
        [
          id, cmd.deal_id, stream_seq, cmd.event_type,
          cmd.actor.actor_type, cmd.actor.actor_id, cmd.actor.agent_id,
          cmd.payload, prevHash, hash, created_at
        ]
      );

      await client.query("COMMIT");

      const r = inserted.rows[0];
      return {
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
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}