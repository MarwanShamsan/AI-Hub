import "dotenv/config";
import { SignJWT, importPKCS8 } from "jose";

async function run() {
  const alg = process.env.JWT_ALG ?? "EdDSA";
  const kid = process.env.JWT_KID ?? "dev-1";

  const privatePem = process.env.JWT_PRIVATE_KEY_PEM;
  if (!privatePem) throw new Error("JWT_PRIVATE_KEY_PEM not set");

  const privateKey = await importPKCS8(privatePem.replace(/\\n/g, "\n"), alg);

  const jwt = await new SignJWT({
    actor_type: "USER",
    tenant_id: "tenant-1"
  })
    .setProtectedHeader({ alg, kid })
    .setSubject("user-1")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);

  console.log(jwt);
}

run();
