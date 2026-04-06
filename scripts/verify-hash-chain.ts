import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { LedgerAuditRepo } from "../services/event-ledger/repo/LedgerAuditRepo";
import {
  verifyDealHashChain,
  verifyFullLedgerPerDeal
} from "../ai-core/audit/hashChainVerifier";
import { sha256Hex } from "../shared/crypto/hashChain";

type CliArgs = {
  mode: "deal" | "all";
  dealId?: string;
};

type AuditEnvelope = {
  tool_name: "hash-chain-verifier";
  tool_version: string;
  generated_at: string;
  mode: "deal" | "full-ledger";
  database_target: string;
  result: unknown;
};

function parseArgs(argv: string[]): CliArgs {
  const hasAll = argv.includes("--all");
  const dealIndex = argv.indexOf("--deal");

  if (hasAll && dealIndex !== -1) {
    throw new Error("Use either --all or --deal <dealId>, not both");
  }

  if (hasAll) {
    return { mode: "all" };
  }

  if (dealIndex !== -1) {
    const dealId = argv[dealIndex + 1];
    if (!dealId) {
      throw new Error("Missing value for --deal");
    }
    return { mode: "deal", dealId };
  }

  throw new Error("Usage: --all OR --deal <dealId>");
}

function printHumanSummary(result: unknown) {
  console.log("=== HASH CHAIN VERIFICATION ===");
  console.log(JSON.stringify(result, null, 2));
}

function makeReportFileName(): string {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  return `hash-chain-${iso}.json`;
}

function buildAuditEnvelope(result: unknown): AuditEnvelope {
  const mode =
    typeof result === "object" &&
    result !== null &&
    "mode" in result &&
    (result as { mode?: unknown }).mode === "deal"
      ? "deal"
      : "full-ledger";

  return {
    tool_name: "hash-chain-verifier",
    tool_version: "1.0.0",
    generated_at: new Date().toISOString(),
    mode,
    database_target: "postgres-events-ledger",
    result
  };
}

function writeReport(result: unknown): void {
  const dir = path.resolve(process.cwd(), "docs", "audit");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const envelope = buildAuditEnvelope(result);
  const fileName = makeReportFileName();
  const fullPath = path.join(dir, fileName);

  const json = JSON.stringify(envelope, null, 2);

  // write main report
  fs.writeFileSync(fullPath, json, "utf8");

  // compute hash of report
  const hash = sha256Hex(json);

  // write hash file
  const hashPath = `${fullPath}.sha256`;
  fs.writeFileSync(hashPath, hash, "utf8");

  console.log(`Audit report saved to: ${fullPath}`);
  console.log(`Report SHA256 saved to: ${hashPath}`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const args = parseArgs(process.argv.slice(2));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const repo = new LedgerAuditRepo(pool);

    if (args.mode === "deal") {
      const events = await repo.loadDealEvents(args.dealId!);
      const result = verifyDealHashChain(events, args.dealId);

      printHumanSummary(result);
      writeReport(result);

      process.exitCode = result.status === "VALID" ? 0 : 1;
      return;
    }

    const dealIds = await repo.listDealIds();
    const result = await verifyFullLedgerPerDeal(dealIds, (dealId) =>
      repo.loadDealEvents(dealId)
    );

    printHumanSummary(result);
    writeReport(result);

    process.exitCode = result.status === "VALID" ? 0 : 1;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Hash chain verification failed to execute");
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});