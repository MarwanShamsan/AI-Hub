import "dotenv/config";
import { Pool } from "pg";
import { EventStore } from "../../event-ledger/repo/EventStore";
import { EngineRunner } from "./EngineRunner";
import { TimeArbiterEngine } from "./timeArbiterEngine";
import { TokenAEngine } from "./tokenA.engine";
import { loadCatalog, loadAuthorityMatrix } from "../../config/loadPolicy";
import { TokenBEngine } from "./tokenB.engine";
import { TokenCEngine } from "./tokenC.engine";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL");

  const policyDir = process.env.POLICY_DIR ?? "./policy";
  const catalog = loadCatalog(policyDir);
  const matrix = loadAuthorityMatrix(policyDir);

  const pool = new Pool({ connectionString });
  const store = new EventStore(pool);

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

  const runner = new EngineRunner(pool, "engine-runner-main", async (ev) => {
    await timeArbiter.onEvent(ev);
    await tokenA.onEvent(ev);
    await tokenB.onEvent(ev);
    await tokenC.onEvent(ev);
  });

  setInterval(() => {
    timeArbiter.tickExpireDueTimers().catch((err) => {
      console.error("[TimeArbiter tick] error:", err);
    });
  }, 10_000);

  console.log("Engine runner started.");
  await runner.startForever({ batchSize: 200, pollMs: 500 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});