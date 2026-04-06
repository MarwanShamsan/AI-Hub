import "dotenv/config";
import { SignJWT, importPKCS8 } from "jose";
import { randomUUID } from "crypto";
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

async function send(token: string, body: any) {
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
    console.error("❌", body.event_type, json);
    process.exit(1);
  }

  console.log("✔", body.event_type);
  return json.event;
}

async function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const dealId = randomUUID();
  console.log("\n🚀 NEW DEAL:", dealId);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // --- DEAL CREATION FLOW ---
  await send(await makeToken("USER"), {
    deal_id: dealId,
    event_type: "DEAL_CREATED",
    payload: {
      deal_title: "Integration Test Deal",
      buyer_id: "B1",
      supplier_id: "S1",
      currency: "USD"
    }
  });

  await send(await makeToken("AGENT", 1), {
    deal_id: dealId,
    event_type: "SUPPLIER_APPROVED",
    payload: { supplier_id: "S1" }
  });

  await send(await makeToken("AGENT", 2), {
    deal_id: dealId,
    event_type: "SPECIFICATION_LOCKED",
    payload: { spec_version: "v1", spec_hash: "hash-spec" }
  });

  await send(await makeToken("AGENT", 3), {
    deal_id: dealId,
    event_type: "REFERENCE_APPROVED",
    payload: { price_ok: true }
  });

  await send(await makeToken("AGENT", 4), {
    deal_id: dealId,
    event_type: "DOCUMENTS_VERIFIED",
    payload: {
      verified_docs: [
        { doc_type: "LC", doc_ref: "vault://lc/1", doc_hash: "hash-lc" }
      ]
    }
  });

  await send(await makeToken("AGENT", 5), {
    deal_id: dealId,
    event_type: "CONTRACT_SIGNED",
    payload: {
      contract_version: "v1",
      contract_hash: "hash-contract",
      token_policy_ref: "policy-v1"
    }
  });

  await send(await makeToken("AGENT", 6), {
    deal_id: dealId,
    event_type: "INSPECTION_PASSED",
    payload: {
      evidence_bundle: [{ evidence_id: "ev1", evidence_hash: "hash-ev1" }],
      gps: { lat: 0, lng: 0 },
      device_id: "device-1"
    }
  });

  await wait(1500);

  // --- SHIPMENT + TOKEN B ---
  await send(await makeToken("AGENT", 7), {
    deal_id: dealId,
    event_type: "SHIPMENT_VERIFIED",
    payload: {
      container_number: "CONT-1",
      seal_number: "SEAL-1",
      bill_of_lading: "BOL-1",
      tracking_ref: "trk-1"
    }
  });

  await wait(1500);

  // --- GOODS RECEIVED ---
  await send(await makeToken("USER"), {
    deal_id: dealId,
    event_type: "GOODS_RECEIVED",
    payload: {
      received_at: new Date().toISOString()
    }
  });

  await wait(1500);

  // --- FORCE TIMER EXPIRY ---
  await pool.query(`
    UPDATE views.timer_index
    SET expires_at = now() - interval '1 minute',
        updated_at = now()
    WHERE deal_id=$1
  `, [dealId]);

  console.log("⏳ Waiting for TIMER_EXPIRED...");
  await wait(12000);

  // --- VERIFY CLOSURE ---
  const result = await pool.query(`
    SELECT event_type
    FROM events
    WHERE deal_id=$1
      AND event_type IN ('TIMER_EXPIRED','TOKEN_C_ISSUED','DEAL_CLOSED')
    ORDER BY stream_seq
  `, [dealId]);

  console.log("\n🔎 Final Events:");
  console.table(result.rows);

  // --- PROOF: no second expiration ---
  const count = await pool.query(`
    SELECT COUNT(*) FROM events
    WHERE deal_id=$1 AND event_type='TIMER_EXPIRED'
  `, [dealId]);

  console.log("\n🛡 TIMER_EXPIRED count:", count.rows[0].count);

  await pool.end();
}

main().catch(console.error);