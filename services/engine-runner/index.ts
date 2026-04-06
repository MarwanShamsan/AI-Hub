import "dotenv/config";
import path from "node:path";
import { Pool } from "pg";

import { EventStore } from "../event-ledger/repo/EventStore";
import { EngineRunner } from "./consumers/EngineRunner";

import { loadCatalog, loadAuthorityMatrix } from "../config/loadPolicy";

import { TimeArbiterEngine } from "./consumers/timeArbiterEngine";
import { TimeArbiterScheduler } from "./schedulers/timeArbiter.scheduler";

import { TokenAEngine } from "./consumers/tokenA.engine";
import { TokenBEngine } from "./consumers/tokenB.engine";
import { TokenCEngine } from "./consumers/tokenC.engine";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL");

  const policyDir =
    process.env.POLICY_DIR ?? path.resolve(process.cwd(), "policy");

  // ✅ Load sovereign law once (same as Command API)
  const catalog = loadCatalog(policyDir);
  const matrix = loadAuthorityMatrix(policyDir);

  const pool = new Pool({ connectionString });
  const store = new EventStore(pool);

  // ✅ Engines
  const timeArbiter = new TimeArbiterEngine(pool, store, catalog, matrix);

  const tokenA = new TokenAEngine(
    store,
    catalog,
    matrix,
    policyDir,
    process.env.SYSTEM_ACTOR_ID ?? "engine:token_a"
  );

  const tokenB = new TokenBEngine(
    store,
    catalog,
    matrix,
    policyDir,
    process.env.SYSTEM_ACTOR_ID_B ?? "engine:token_b"
  );

  const tokenC = new TokenCEngine(
    store,
    catalog,
    matrix,
    policyDir,
    process.env.AGENT9_ACTOR_ID ?? "agent-9-engine"
  );

  // ✅ Runner (event-driven)
  const runner = new EngineRunner(pool, "engine-runner-main", async (ev) => {
    await timeArbiter.onEvent(ev);
    await tokenA.onEvent(ev);
    await tokenB.onEvent(ev);
    await tokenC.onEvent(ev);
  });

  // ✅ Scheduler (time-based) — لا نستخدم setInterval اليدوي بعد الآن
  const scheduler = new TimeArbiterScheduler(timeArbiter, 10_000);
  scheduler.start();

  console.log("Engine runner started.");

  // ✅ Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down engine-runner...");
    scheduler.stop();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  await runner.startForever({ batchSize: 200, pollMs: 500 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});