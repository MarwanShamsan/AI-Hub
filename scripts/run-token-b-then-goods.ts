import "dotenv/config";
import { SignJWT, importPKCS8 } from "jose";
import { Pool } from "pg";

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

  console.log("✔", body.event_type);
  return json.event;
}

async function main() {
  const dealId = process.argv[2];
  if (!dealId) {
    console.error("Usage: npx ts-node --transpile-only scripts/run-token-b-then-goods.ts <DEAL_ID>");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // 1) SHIPMENT_VERIFIED (Agent 7)
  await sendEvent(await makeToken("AGENT", 7), {
    deal_id: dealId,
    event_type: "SHIPMENT_VERIFIED",
    payload: {
    container_number: "CONT-1",
    seal_number: "SEAL-1",
    bill_of_lading: "BOL-1",
    tracking_ref: "trk-1"
    }
  });

  console.log("⏳ Waiting for TOKEN_B...");
  await new Promise(r => setTimeout(r, 1500));

  const tokenB = await pool.query(
    `SELECT payload FROM events WHERE deal_id=$1 AND event_type='TOKEN_B_ISSUED'`,
    [dealId]
  );

  if (tokenB.rowCount === 0) {
    console.log("❌ TOKEN_B not issued");
    process.exit(1);
  } else {
    console.log("🔥 TOKEN_B ISSUED:", tokenB.rows[0].payload);
  }

  // 2) GOODS_RECEIVED (USER) — now should pass
  await sendEvent(await makeToken("USER"), {
    deal_id: dealId,
    event_type: "GOODS_RECEIVED",
    payload: {
    received_at: new Date().toISOString(),
    location: "QA-TEST"
    }
  });

  console.log("⏳ Waiting for TIMER_STARTED...");
  await new Promise(r => setTimeout(r, 1500));

  const timerStarted = await pool.query(
    `SELECT payload, created_at FROM events WHERE deal_id=$1 AND event_type='TIMER_STARTED' ORDER BY stream_seq DESC LIMIT 1`,
    [dealId]
  );

  if (timerStarted.rowCount === 0) {
    console.log("❌ TIMER_STARTED not emitted");
  } else {
    console.log("🕒 TIMER_STARTED:", timerStarted.rows[0]);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
