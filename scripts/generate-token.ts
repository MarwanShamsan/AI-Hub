import { SignJWT, importPKCS8 } from 'jose';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY_PEM!;
  const alg = process.env.JWT_ALG!;
  const kid = process.env.JWT_KID!;

  const privateKey = await importPKCS8(privateKeyPem, alg);

const token = await new SignJWT({
  sub: "agent-6",
  actor_type: "AGENT",
  tenant_id: "tenant-qa",
  agent_id: 6
})
    .setProtectedHeader({ alg, kid })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);

  console.log("\nTOKEN:\n");
  console.log(token);
}

main();
