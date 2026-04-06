import test from "node:test";
import assert from "node:assert/strict";
import { sha256Hex } from "../../shared/crypto/hashChain";
import { verifyAuditReportIntegrity } from "../../ai-core/audit/reportIntegrityVerifier";

test("verifyAuditReportIntegrity => VALID when report matches sha256", () => {
  const report = JSON.stringify(
    {
      tool_name: "hash-chain-verifier",
      result: { status: "VALID" }
    },
    null,
    2
  );

  const hash = sha256Hex(report);

  const result = verifyAuditReportIntegrity({
    reportPath: "/tmp/report.json",
    hashPath: "/tmp/report.json.sha256",
    reportContent: report,
    expectedHashContent: hash
  });

  assert.equal(result.status, "VALID");
  assert.equal(result.actual_sha256, hash);
});

test("verifyAuditReportIntegrity => INVALID when report is tampered", () => {
  const originalReport = JSON.stringify(
    {
      tool_name: "hash-chain-verifier",
      result: { status: "VALID" }
    },
    null,
    2
  );

  const tamperedReport = JSON.stringify(
    {
      tool_name: "hash-chain-verifier",
      result: { status: "INVALID" }
    },
    null,
    2
  );

  const originalHash = sha256Hex(originalReport);

  const result = verifyAuditReportIntegrity({
    reportPath: "/tmp/report.json",
    hashPath: "/tmp/report.json.sha256",
    reportContent: tamperedReport,
    expectedHashContent: originalHash
  });

  assert.equal(result.status, "INVALID");
  assert.equal(result.reason, "Report content hash does not match stored SHA256");
});

test("verifyAuditReportIntegrity => INVALID when hash file is empty", () => {
  const report = JSON.stringify({ ok: true }, null, 2);

  const result = verifyAuditReportIntegrity({
    reportPath: "/tmp/report.json",
    hashPath: "/tmp/report.json.sha256",
    reportContent: report,
    expectedHashContent: "   \n"
  });

  assert.equal(result.status, "INVALID");
  assert.equal(result.reason, "Hash file is empty");
});