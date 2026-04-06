import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { randomUUID } from "crypto";
import { SignJWT, importPKCS8 } from "jose";

const API = "http://localhost:3001/commands";

async function makeToken(actor_type: "USER" | "AGENT" | "SYSTEM", agent_id?: number) {
  const key = await importPKCS8(
    process.env.JWT_PRIVATE_KEY_PEM!.replace(/\\n/g, "\n"),
    process.env.JWT_ALG!
  );

  return new SignJWT({
    sub: actor_type === "AGENT" ? `agent-${agent_id}` : "test-user",
    actor_type,
    tenant_id: "tenant-test",
    agent_id: actor_type === "AGENT" ? agent_id : undefined
  })
    .setProtectedHeader({ alg: process.env.JWT_ALG!, kid: process.env.JWT_KID! })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
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

  return { ok: res.ok, json };
}

function wait(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

test("Dispute Path E2E", async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const user = await makeToken("USER");
  const system = await makeToken("SYSTEM");

  const agent1 = await makeToken("AGENT", 1);
  const agent2 = await makeToken("AGENT", 2);
  const agent3 = await makeToken("AGENT", 3);
  const agent4 = await makeToken("AGENT", 4);
  const agent5 = await makeToken("AGENT", 5);
  const agent6 = await makeToken("AGENT", 6);
  const agent7 = await makeToken("AGENT", 7);

  const deal = randomUUID();

  // --- bootstrap deal ---
  await send(user, {
    deal_id: deal,
    event_type: "DEAL_CREATED",
    payload: {
      deal_title: "Test",
      buyer_id: "b",
      supplier_id: "s",
      currency: "USD"
    }
  });

  await send(agent1, { deal_id: deal, event_type: "SUPPLIER_APPROVED", payload: { supplier_id: "s", risk_score: 1 } });
  await send(agent2, { deal_id: deal, event_type: "SPECIFICATION_LOCKED", payload: { spec_version: "v1", spec_hash: "h" } });
  await send(agent3, { deal_id: deal, event_type: "REFERENCE_APPROVED", payload: { price_ok: true } });
  await send(agent4, { deal_id: deal, event_type: "DOCUMENTS_VERIFIED", payload: { verified_docs: [] } });
  await send(agent5, { deal_id: deal, event_type: "CONTRACT_SIGNED", payload: { contract_version: "v1", contract_hash: "h", token_policy_ref: "x" } });

  await send(agent6, {
    deal_id: deal,
    event_type: "INSPECTION_PASSED",
    payload: {
      evidence_bundle: [{ evidence_id: "1", evidence_hash: "h" }],
      gps: { lat: 1, lng: 1 },
      device_id: "d"
    }
  });

  await wait(1000);

  await send(agent7, {
    deal_id: deal,
    event_type: "SHIPMENT_VERIFIED",
    payload: {
      container_number: "c",
      seal_number: "s",
      bill_of_lading: "b",
      tracking_ref: "t"
    }
  });

  await wait(1000);

  await send(user, {
    deal_id: deal,
    event_type: "GOODS_RECEIVED",
    payload: {
      received_at: new Date().toISOString()
    }
  });

  await wait(2000);

  // --- (D) missing evidence ---
  const d = await send(user, {
    deal_id: deal,
    event_type: "DISPUTE_OPENED",
    payload: { dispute_type: "QUALITY", opened_at: new Date().toISOString() }
  });

  assert.equal(d.json.status, "REJECTED_RECORDED");

  // --- (A) valid dispute ---
  const a = await send(user, {
    deal_id: deal,
    event_type: "DISPUTE_OPENED",
    payload: {
      dispute_type: "QUALITY",
      evidence_bundle: [{ evidence_id: "2", evidence_hash: "h" }],
      opened_at: new Date().toISOString()
    }
  });

  assert.equal(a.json.status, "ACCEPTED");

  await pool.query(`
    UPDATE views.timer_index
    SET expires_at = now() - interval '1 minute'
    WHERE deal_id = $1
  `, [deal]);

  await wait(10000);

  const cCount = await pool.query(
    `SELECT COUNT(*)::int AS c FROM events WHERE deal_id=$1 AND event_type='TOKEN_C_ISSUED'`,
    [deal]
  );

  assert.equal(cCount.rows[0].c, 0);

  // --- (B) resolve ---
  await send(system, {
    deal_id: deal,
    event_type: "DISPUTE_RESOLVED",
    payload: {
      resolution_code: "OK",
      resolved_at: new Date().toISOString()
    }
  });

  await wait(10000);

  const closed = await pool.query(
    `SELECT event_type FROM events WHERE deal_id=$1 AND event_type='DEAL_CLOSED'`,
    [deal]
  );

  assert.equal(closed.rowCount, 1);

  await pool.end();
});