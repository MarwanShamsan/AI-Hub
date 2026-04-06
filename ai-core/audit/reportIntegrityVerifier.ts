import { sha256Hex } from "../../shared/crypto/hashChain";

export type AuditReportVerificationResult = {
  status: "VALID" | "INVALID";
  report_path: string;
  hash_path: string;
  expected_sha256: string;
  actual_sha256: string;
  reason?: string;
};

export function verifyAuditReportIntegrity(params: {
  reportPath: string;
  hashPath: string;
  reportContent: string;
  expectedHashContent: string;
}): AuditReportVerificationResult {
  const actualSha256 = sha256Hex(params.reportContent);
  const expectedSha256 = params.expectedHashContent.trim();

  if (!expectedSha256) {
    return {
      status: "INVALID",
      report_path: params.reportPath,
      hash_path: params.hashPath,
      expected_sha256: "",
      actual_sha256: actualSha256,
      reason: "Hash file is empty"
    };
  }

  if (actualSha256 !== expectedSha256) {
    return {
      status: "INVALID",
      report_path: params.reportPath,
      hash_path: params.hashPath,
      expected_sha256: expectedSha256,
      actual_sha256: actualSha256,
      reason: "Report content hash does not match stored SHA256"
    };
  }

  return {
    status: "VALID",
    report_path: params.reportPath,
    hash_path: params.hashPath,
    expected_sha256: expectedSha256,
    actual_sha256: actualSha256
  };
}