import {
  createHash,
  randomBytes
} from "crypto";
import { env } from "../config/env";

const VERIFICATION_TOKEN_BYTES = 32;

export type GeneratedEmailVerificationToken = {
  rawToken: string;
  tokenHash: string;
  expiresAt: string;
};

function encodeBase64Url(value: Buffer): string {
  return value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function hashEmailVerificationToken(
  rawToken: string
): string {
  return createHash("sha256")
    .update(rawToken, "utf8")
    .digest("hex");
}

export function generateEmailVerificationToken(
  now: Date = new Date()
): GeneratedEmailVerificationToken {
  const rawToken = encodeBase64Url(
    randomBytes(VERIFICATION_TOKEN_BYTES)
  );

  const tokenHash = hashEmailVerificationToken(rawToken);

  const expiresAt = new Date(
    now.getTime() +
      env.emailVerificationTtlMinutes * 60 * 1000
  ).toISOString();

  return {
    rawToken,
    tokenHash,
    expiresAt
  };
}