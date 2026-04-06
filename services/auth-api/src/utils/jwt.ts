import { env } from "../config/env";

export type AuthJwtPayload = {
  sub: string;
  actor_type: "USER";
  tenant_id: string;
  role: "client" | "supplier" | "agent6" | "ops";
  agent_id: number | null;
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
  return await import("jose");
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

export async function signAccessToken(payload: AuthJwtPayload): Promise<string> {
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

export async function signRefreshToken(payload: AuthJwtPayload): Promise<string> {
  const { SignJWT } = await getJose();
  const privateKey = await getPrivateKey();

  return new SignJWT(payload)
    .setProtectedHeader({
      alg: env.jwtAlg,
      kid: env.jwtKid
    })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(env.refreshTokenExpiresIn)
    .sign(privateKey);
}

export async function verifyToken(token: string): Promise<AuthJwtPayload> {
  const { jwtVerify } = await getJose();
  const publicKey = await getPublicKey();

  const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
    algorithms: [env.jwtAlg]
  });

  if (env.jwtKid && protectedHeader.kid !== env.jwtKid) {
    throw new Error("UNKNOWN_KID");
  }

  return payload as unknown as AuthJwtPayload;
}