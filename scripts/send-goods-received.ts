import "dotenv/config";
import { SignJWT, importPKCS8 } from "jose";

const API = "http://localhost:3001/commands";

async function makeToken(actor_type: "USER" | "AGENT", agent_id?: number) {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY_PEM!;
  const alg = process.env.JWT_ALG!;
  const kid = process.env.JWT_KID!;

  const privateKey = await importPKCS8(privateKeyPem.replace(/\\n/g, "\n"), alg);

  return new SignJWT({
    sub: agent_id ? `agent-${agent_id}` : "qa-user",
    actor_type,
    tenant_id: "tenant-qa",
    agent_id: actor_type === "AGENT" ? agent_id : undefined
  })
    .setProtectedHeader({ alg, kid })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}

async function sendEvent(token: string, body: any) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("❌ Event rejected:", json);
    process.exit(1);
  }

  console.log("✔", body.event_type, "->", json.event?.id ?? "(no id)");
  return json.event;
}

async function main() {
  const dealId = process.argv[2];
  if (!dealId) {
    console.error("Usage: npx ts-node --transpile-only scripts/send-goods-received.ts <DEAL_ID>");
    process.exit(1);
  }

  // ⚠️ authority depends on your catalog:
  // If GOODS_RECEIVED requires AGENT 7, change makeToken("USER") to makeToken("AGENT", 7)
  const token = await makeToken("AGENT", 7);

  await sendEvent(token, {
    deal_id: dealId,
    event_type: "GOODS_RECEIVED",
    payload: {}
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});