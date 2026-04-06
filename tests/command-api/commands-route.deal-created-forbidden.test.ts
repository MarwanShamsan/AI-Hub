import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { SignJWT, importPKCS8 } from "jose";

const API = "http://localhost:3001/commands";

async function makeUserToken() {
  const key = await importPKCS8(
    process.env.JWT_PRIVATE_KEY_PEM!.replace(/\\n/g, "\n"),
    process.env.JWT_ALG!
  );

  return new SignJWT({
    sub: "test-user",
    actor_type: "USER",
    tenant_id: "tenant-test"
  })
    .setProtectedHeader({ alg: process.env.JWT_ALG!, kid: process.env.JWT_KID! })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
}

test("POST /commands rejects DEAL_CREATED", async () => {
  const token = await makeUserToken();

  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      deal_id: randomUUID(),
      event_type: "DEAL_CREATED",
      payload: {
        deal_title: "Forbidden",
        buyer_id: "buyer-x",
        supplier_id: "supplier-y",
        currency: "USD"
      }
    })
  });

  const json = await res.json();

  assert.equal(res.status, 403);
  assert.equal(json.reason, "DEAL_CREATED_FORBIDDEN");
});