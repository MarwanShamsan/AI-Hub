import fs from "node:fs";
import path from "node:path";
import { verifyAuditReportIntegrity } from "../ai-core/audit/reportIntegrityVerifier";

type CliArgs = {
  reportPath: string;
};

function parseArgs(argv: string[]): CliArgs {
  const fileIndex = argv.indexOf("--file");

  if (fileIndex === -1) {
    throw new Error("Usage: --file <report.json>");
  }

  const reportPath = argv[fileIndex + 1];

  if (!reportPath) {
    throw new Error("Missing value for --file");
  }

  return { reportPath };
}

function printResult(result: unknown) {
  console.log("=== AUDIT REPORT INTEGRITY VERIFICATION ===");
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const reportPath = path.resolve(process.cwd(), args.reportPath);
  const hashPath = `${reportPath}.sha256`;

  if (!fs.existsSync(reportPath)) {
    throw new Error(`Report file not found: ${reportPath}`);
  }

  if (!fs.existsSync(hashPath)) {
    throw new Error(`SHA256 file not found: ${hashPath}`);
  }

  const reportContent = fs.readFileSync(reportPath, "utf8");
  const expectedHashContent = fs.readFileSync(hashPath, "utf8");

  const result = verifyAuditReportIntegrity({
    reportPath,
    hashPath,
    reportContent,
    expectedHashContent
  });

  printResult(result);

  process.exitCode = result.status === "VALID" ? 0 : 1;
}

main().catch((err) => {
  console.error("Audit report verification failed to execute");
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});