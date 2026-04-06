import { SignJWT, importPKCS8 } from "jose";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const API = "http://localhost:3001/commands";

async function makeToken(actor_type: "USER" | "AGENT", agent_id?: number) {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY_PEM!;
  const alg = process.env.JWT_ALG!;
  const kid = process.env.JWT_KID!;

  const privateKey = await importPKCS8(
    privateKeyPem.replace(/\\n/g, "\n"),
    alg
  );

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
  const dealId = randomUUID();
  console.log("DEAL:", dealId);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await sendEvent(await makeToken("USER"), {
    deal_id: dealId,
    event_type: "DEAL_CREATED",
    payload: {
      deal_title: "Auto Deal",
      buyer_id: "B1",
      supplier_id: "S1",
      currency: "USD"
    }
  });

  await sendEvent(await makeToken("AGENT", 1), {
    deal_id: dealId,
    event_type: "SUPPLIER_APPROVED",
    payload: { supplier_id: "S1", risk_score: 10 }
  });

  await sendEvent(await makeToken("AGENT", 2), {
    deal_id: dealId,
    event_type: "SPECIFICATION_LOCKED",
    payload: {
      spec_version: "v1",
      spec_hash: "hash-spec"
    }
  });

  await sendEvent(await makeToken("AGENT", 3), {
    deal_id: dealId,
    event_type: "REFERENCE_APPROVED",
    payload: { price_ok: true }
  });

  await sendEvent(await makeToken("AGENT", 4), {
    deal_id: dealId,
    event_type: "DOCUMENTS_VERIFIED",
    payload: {
      verified_docs: [
        {
          doc_type: "LC",
          doc_ref: "vault://lc/1",
          doc_hash: "hash-lc"
        }
      ]
    }
  });

  await sendEvent(await makeToken("AGENT", 5), {
    deal_id: dealId,
    event_type: "CONTRACT_SIGNED",
    payload: {
      contract_version: "v1",
      contract_hash: "hash-contract",
      token_policy_ref: "policy-v1"
    }
  });

  await sendEvent(await makeToken("AGENT", 6), {
    deal_id: dealId,
    event_type: "INSPECTION_PASSED",
    payload: {
      evidence_bundle: [
        { evidence_id: "ev1", evidence_hash: "hash-ev1" }
      ],
      gps: { lat: 0, lng: 0 },
      device_id: "device-1"
    }
  });

  

  console.log("⏳ Waiting for TOKEN_A...");
  await new Promise(r => setTimeout(r, 1500));

  const result = await pool.query(
    `SELECT payload FROM events WHERE deal_id=$1 AND event_type='TOKEN_A_ISSUED'`,
    [dealId]
  );

  if (result.rowCount === 0) {
    console.log("❌ TOKEN_A not issued");
  } else {
    console.log("🔥 TOKEN_A ISSUED:");
    console.log(result.rows[0].payload);
  }

  await pool.end();
}

main();