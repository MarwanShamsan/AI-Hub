import {
  createHash,
  randomBytes
} from "node:crypto";
import { env } from "../config/env";

export type GeneratedPasswordResetToken = {
  rawToken: string;
  tokenHash: string;
  expiresAt: string;
};

export function hashPasswordResetToken(
  token: string
): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

export function generatePasswordResetToken(
  now: Date = new Date()
): GeneratedPasswordResetToken {
  const rawToken =
    randomBytes(32)
      .toString("base64url");

  const expiresAt =
    new Date(
      now.getTime() +
        env.passwordResetTtlMinutes *
          60 *
          1000
    ).toISOString();

  return {
    rawToken,
    tokenHash:
      hashPasswordResetToken(
        rawToken
      ),
    expiresAt
  };
}