import { env } from "../config/env";
import type { AuthRole } from "../types/auth";

export type AuthJwtPayload = {
  sub: string;
  actor_type: "USER";
  tenant_id: string;
  role: AuthRole;
  agent_id: number | null;
};

export type AuthRefreshJwtPayload = AuthJwtPayload & {
  jti: string;
};

export type VerifiedAuthJwtPayload = AuthJwtPayload & {
  iat?: number;
  exp?: number;
  jti?: string;
};

function normalizePem(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "")
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

async function getJose() {
  return import("jose");
}

async function getPrivateKey() {
  const { importPKCS8 } = await getJose();
  const normalized = normalizePem(env.jwtPrivateKeyPem);

  return importPKCS8(normalized, env.jwtAlg);
}

async function getPublicKey() {
  const { importSPKI } = await getJose();
  const normalized = normalizePem(env.jwtPublicKeyPem);

  return importSPKI(normalized, env.jwtAlg);
}

export async function signAccessToken(
  payload: AuthJwtPayload
): Promise<string> {
  const { SignJWT } = await getJose();
  const privateKey = await getPrivateKey();

  return new SignJWT(payload)
    .setProtectedHeader({
      alg: env.jwtAlg,
      kid: env.jwtKid
    })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(env.accessTokenExpiresIn)
    .sign(privateKey);
}

export async function signRefreshToken(
  payload: AuthRefreshJwtPayload
): Promise<string> {
  const { SignJWT } = await getJose();
  const privateKey = await getPrivateKey();

  return new SignJWT(payload)
    .setProtectedHeader({
      alg: env.jwtAlg,
      kid: env.jwtKid
    })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(env.refreshTokenExpiresIn)
    .sign(privateKey);
}

export async function verifyToken(
  token: string
): Promise<VerifiedAuthJwtPayload> {
  const { jwtVerify } = await getJose();
  const publicKey = await getPublicKey();

  const { payload, protectedHeader } = await jwtVerify(
    token,
    publicKey,
    {
      algorithms: [env.jwtAlg]
    }
  );

  if (env.jwtKid && protectedHeader.kid !== env.jwtKid) {
    throw new Error("UNKNOWN_KID");
  }

  if (
    typeof payload.sub !== "string" ||
    typeof payload.tenant_id !== "string" ||
    typeof payload.role !== "string" ||
    payload.actor_type !== "USER"
  ) {
    throw new Error("INVALID_AUTH_TOKEN_PAYLOAD");
  }

  return payload as unknown as VerifiedAuthJwtPayload;
}

/**
 * Reads the expiration from a token that was created by this service.
 *
 * This keeps app_auth.refresh_tokens.expires_at exactly aligned with the
 * JWT exp claim instead of assuming a hardcoded seven-day duration.
 */
export async function getTokenExpirationIso(
  token: string
): Promise<string> {
  const { decodeJwt } = await getJose();
  const payload = decodeJwt(token);

  if (
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp)
  ) {
    throw new Error("TOKEN_EXPIRATION_MISSING");
  }

  return new Date(payload.exp * 1000).toISOString();
}