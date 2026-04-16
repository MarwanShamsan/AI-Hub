import { FastifyRequest } from "fastify";
import { jwtVerify, importSPKI } from "jose";

export type Identity = {
  actor_type: "USER" | "AGENT" | "SYSTEM";
  actor_id: string;
  agent_id: number | null;
  tenant_id: string;
};

type Claims = {
  sub: string;
  actor_type: "USER" | "AGENT" | "SYSTEM";
  agent_id?: number | null;
  tenant_id: string;
};

export async function extractIdentity(req: FastifyRequest): Promise<Identity> {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    throw new Error("MISSING_OR_INVALID_AUTH");
  }

  const token = auth.slice("Bearer ".length);

  const publicPem = process.env.JWT_PUBLIC_KEY_PEM;
  const alg = process.env.JWT_ALG ?? "EdDSA";

  if (!publicPem) {
    throw new Error("JWT_PUBLIC_KEY_PEM_NOT_SET");
  }

  const publicKey = await importSPKI(
    publicPem.replace(/\\n/g, "\n"),
    alg
  );

  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ["EdDSA"]
  });

  const claims = payload as unknown as Claims;

  if (!claims?.sub || !claims?.actor_type || !claims?.tenant_id) {
    throw new Error("INVALID_TOKEN_CLAIMS");
  }

  const agent_id =
    claims.actor_type === "AGENT" ? claims.agent_id ?? null : null;

  if (claims.actor_type === "AGENT") {
    if (!agent_id || agent_id < 1 || agent_id > 9) {
      throw new Error("INVALID_AGENT_ID");
    }
  }

  return {
    actor_type: claims.actor_type,
    actor_id: claims.sub,
    agent_id,
    tenant_id: claims.tenant_id
  };
}