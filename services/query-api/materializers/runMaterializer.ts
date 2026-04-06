import { Pool } from "pg";
import { EventReader } from "../../event-ledger/repo/EventReader";
import { applyDealEvent } from "./DealProjector";

const ENGINE_NAME = "query-api-materializer";

async function getCheckpoint(pool: Pool): Promise<number> {
  const res = await pool.query(
    `
    SELECT last_seq
    FROM engine_checkpoints
    WHERE engine_name = $1
    `,
    [ENGINE_NAME]
  );

  return res.rowCount ? Number(res.rows[0].last_seq) : 0;
}

async function setCheckpoint(client: any, lastSeq: number): Promise<void> {
  await client.query(
    `
    INSERT INTO engine_checkpoints (engine_name, last_seq, updated_at)
    VALUES ($1, $2, now())
    ON CONFLICT (engine_name) DO UPDATE SET
      last_seq = EXCLUDED.last_seq,
      updated_at = now()
    `,
    [ENGINE_NAME, lastSeq]
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runMaterializerLoop(pool: Pool): Promise<void> {
  const reader = new EventReader(pool);

  while (true) {
    const checkpoint = await getCheckpoint(pool);
    const batch = await reader.readFromSeq(checkpoint, 500);

    if (batch.length === 0) {
      await sleep(500);
      continue;
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let lastSeq = checkpoint;

      for (const ev of batch) {
        await applyDealEvent(client, ev);
        lastSeq = ev.seq;
      }

      await setCheckpoint(client, lastSeq);

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}