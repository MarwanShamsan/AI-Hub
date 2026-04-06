import "dotenv/config";
import { SignJWT, importPKCS8 } from "jose";
import { randomUUID } from "crypto";
import { Pool } from "pg";

const API = "http://localhost:3001/commands";

type ActorType = "USER" | "AGENT" | "SYSTEM";

async function makeToken(actor_type: ActorType, agent_id?: number) {
  const privateKeyPem = process.env.JWT_PRIVATE_KEY_PEM!;
  const alg = process.env.JWT_ALG!;
  const kid = process.env.JWT_KID!;

  const privateKey = await importPKCS8(privateKeyPem.replace(/\\n/g, "\n"), alg);

  return new SignJWT({
    sub:
      actor_type === "AGENT"
        ? `agent-${agent_id}`
        : actor_type === "SYSTEM"
          ? "qa-system"
          : "qa-user",
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

  return json;
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function seedDealToTimerStarted(
  dealId: string,
  userToken: string,
  agent1: string,
  agent2: string,
  agent3: string,
  agent4: string,
  agent5: string,
  agent6: string,
  agent7: string
) {
  await send(userToken, {
    deal_id: dealId,
    event_type: "DEAL_CREATED",
    payload: {
      deal_title: `Dispute Flow ${dealId}`,
      buyer_id: "buyer-test-001",
      supplier_id: "supplier-test-001",
      currency: "USD"
    }
  });

  await send(agent1, {
    deal_id: dealId,
    event_type: "SUPPLIER_APPROVED",
    payload: {
      supplier_id: "supplier-test-001",
      risk_score: 12,
      notes: "approved for flow test"
    }
  });

  await send(agent2, {
    deal_id: dealId,
    event_type: "SPECIFICATION_LOCKED",
    payload: {
      spec_version: "v1",
      spec_hash: "spec-hash-001",
      standards: ["ISO-TEST-1"]
    }
  });

  await send(agent3, {
    deal_id: dealId,
    event_type: "REFERENCE_APPROVED",
    payload: {
      price_ok: true,
      notes: "reference approved"
    }
  });

  await send(agent4, {
    deal_id: dealId,
    event_type: "DOCUMENTS_VERIFIED",
    payload: {
      verified_docs: [
        {
          doc_type: "CERTIFICATE",
          doc_ref: "vault://doc-001",
          doc_hash: "doc-hash-001",
          authority: "QA Authority"
        }
      ]
    }
  });

  await send(agent5, {
    deal_id: dealId,
    event_type: "CONTRACT_SIGNED",
    payload: {
      contract_version: "v1",
      contract_hash: "contract-hash-001",
      token_policy_ref: "token-rules.yaml"
    }
  });

  await send(agent6, {
    deal_id: dealId,
    event_type: "INSPECTION_PASSED",
    payload: {
      evidence_bundle: [
        { evidence_id: "ev-ins-001", evidence_hash: "hash-ins-001" }
      ],
      gps: {
        lat: 15.3694,
        lng: 44.1910
      },
      device_id: "device-agent6-001",
      notes: "inspection passed"
    }
  });

  await wait(1500);

  await send(agent7, {
    deal_id: dealId,
    event_type: "SHIPMENT_VERIFIED",
    payload: {
      container_number: "CONT-001",
      seal_number: "SEAL-001",
      bill_of_lading: "BOL-001",
      tracking_ref: "TRACK-001"
    }
  });

  await wait(1500);

  await send(userToken, {
    deal_id: dealId,
    event_type: "GOODS_RECEIVED",
    payload: {
      received_at: new Date().toISOString(),
      location: "Port Warehouse A"
    }
  });

  await wait(2500);
}

async function main() {
  const userToken = await makeToken("USER");
  const systemToken = await makeToken("SYSTEM");

  const agent1 = await makeToken("AGENT", 1);
  const agent2 = await makeToken("AGENT", 2);
  const agent3 = await makeToken("AGENT", 3);
  const agent4 = await makeToken("AGENT", 4);
  const agent5 = await makeToken("AGENT", 5);
  const agent6 = await makeToken("AGENT", 6);
  const agent7 = await makeToken("AGENT", 7);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // ---------------------------------------------------------------------------
  // Deal A:
  // (D) dispute without evidence -> DISPUTE_REJECTED
  // (A) valid dispute before expiry blocks TOKEN_C
  // (B) DISPUTE_RESOLVED allows TOKEN_C + DEAL_CLOSED after expiry
  // ---------------------------------------------------------------------------
  const dealA = randomUUID();
  console.log("\n=== DEAL A ===", dealA);

  await seedDealToTimerStarted(
    dealA,
    userToken,
    agent1,
    agent2,
    agent3,
    agent4,
    agent5,
    agent6,
    agent7
  );

  // (D) dispute without evidence
  const d1 = await send(userToken, {
    deal_id: dealA,
    event_type: "DISPUTE_OPENED",
    payload: {
      dispute_type: "QUALITY",
      opened_at: new Date().toISOString()
    }
  });

  if (d1.status !== "REJECTED_RECORDED") {
    console.error("❌ Expected REJECTED_RECORDED for missing evidence, got:", d1);
    process.exit(1);
  }
  console.log("✔ (D) Missing evidence recorded:", d1.event?.event_type, d1.event?.payload?.reason_code);

  // (A) valid dispute before expiry
  const a1 = await send(userToken, {
    deal_id: dealA,
    event_type: "DISPUTE_OPENED",
    payload: {
      dispute_type: "QUALITY",
      evidence_bundle: [
        { evidence_id: "ev-disp-001", evidence_hash: "hash-disp-001" }
      ],
      opened_at: new Date().toISOString()
    }
  });

  if (a1.status !== "ACCEPTED") {
    console.error("❌ Expected ACCEPTED for valid dispute, got:", a1);
    process.exit(1);
  }
  console.log("✔ (A) Dispute opened");

  await pool.query(
    `
    UPDATE views.timer_index
    SET expires_at = now() - interval '1 minute',
        updated_at = now()
    WHERE deal_id=$1
    `,
    [dealA]
  );

  console.log("⏳ Waiting for TIMER_EXPIRED...");
  await wait(12000);

  const tokenCCountA = await pool.query(
    `SELECT COUNT(*)::int AS c FROM events WHERE deal_id=$1 AND event_type='TOKEN_C_ISSUED'`,
    [dealA]
  );

  if (tokenCCountA.rows[0].c !== 0) {
    console.error("❌ Expected TOKEN_C_ISSUED to be blocked while dispute open. Count:", tokenCCountA.rows[0].c);
    process.exit(1);
  }
  console.log("✔ (A) Token C blocked while dispute is open");

  // (B) resolve dispute
  const b1 = await send(systemToken, {
    deal_id: dealA,
    event_type: "DISPUTE_RESOLVED",
    payload: {
      resolution_code: "ACCEPTED",
      resolved_at: new Date().toISOString()
    }
  });

  if (b1.status !== "ACCEPTED") {
    console.error("❌ Expected ACCEPTED for DISPUTE_RESOLVED, got:", b1);
    process.exit(1);
  }
  console.log("✔ (B) Dispute resolved");

  console.log("⏳ Waiting for TOKEN_C_ISSUED + DEAL_CLOSED...");
  await wait(12000);

  const closureA = await pool.query(
    `SELECT event_type FROM events WHERE deal_id=$1 AND event_type IN ('TOKEN_C_ISSUED','DEAL_CLOSED') ORDER BY stream_seq`,
    [dealA]
  );

  const typesA = closureA.rows.map((r: any) => r.event_type);
  if (!typesA.includes("TOKEN_C_ISSUED") || !typesA.includes("DEAL_CLOSED")) {
    console.error("❌ Expected TOKEN_C_ISSUED and DEAL_CLOSED after resolve. Got:", typesA);
    process.exit(1);
  }
  console.log("✔ (B) Closure succeeded:", typesA.join(", "));

  // ---------------------------------------------------------------------------
  // Deal C:
  // open valid dispute before expiry, then after TIMER_EXPIRED attempt another DISPUTE_OPENED
  // => must record DISPUTE_REJECTED with LATE_AFTER_TIMER_EXPIRED
  // ---------------------------------------------------------------------------
  const dealC = randomUUID();
  console.log("\n=== DEAL C ===", dealC);

  await seedDealToTimerStarted(
    dealC,
    userToken,
    agent1,
    agent2,
    agent3,
    agent4,
    agent5,
    agent6,
    agent7
  );

  await send(userToken, {
    deal_id: dealC,
    event_type: "DISPUTE_OPENED",
    payload: {
      dispute_type: "QUALITY",
      evidence_bundle: [
        { evidence_id: "ev-c-disp-001", evidence_hash: "hash-c-disp-001" }
      ],
      opened_at: new Date().toISOString()
    }
  });

  await pool.query(
    `
    UPDATE views.timer_index
    SET expires_at = now() - interval '1 minute',
        updated_at = now()
    WHERE deal_id=$1
    `,
    [dealC]
  );

  console.log("⏳ Waiting for TIMER_EXPIRED...");
  await wait(12000);

  const c1 = await send(userToken, {
    deal_id: dealC,
    event_type: "DISPUTE_OPENED",
    payload: {
      dispute_type: "QUALITY",
      evidence_bundle: [
        { evidence_id: "ev-c-late-001", evidence_hash: "hash-c-late-001" }
      ],
      opened_at: new Date().toISOString()
    }
  });

  if (c1.status !== "REJECTED_RECORDED") {
    console.error("❌ Expected REJECTED_RECORDED for late dispute, got:", c1);
    process.exit(1);
  }

  const reasonCode = c1.event?.payload?.reason_code;
  if (reasonCode !== "LATE_AFTER_TIMER_EXPIRED") {
    console.error("❌ Expected reason_code=LATE_AFTER_TIMER_EXPIRED, got:", reasonCode, c1.event?.payload);
    process.exit(1);
  }
  console.log("✔ (C) Late dispute recorded:", reasonCode);

  await pool.end();
  console.log("\n✅ Dispute path flow test PASSED.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});