import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT, importPKCS8 } from "jose";

const API = "http://localhost:3001/deals/from-request";

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
  return { status: res.status, ok: res.ok, json };
}

test("POST /deals/from-request creates a sovereign deal", async () => {
  const token = await makeUserToken();

  const res = await send(token, {
    request_id: `req-${Date.now()}-1`,
    buyer_id: "buyer-1",
    supplier_id: "supplier-1",
    deal_title: "Test Deal",
    currency: "USD"
  });

  assert.equal(res.status, 201);
  assert.equal(res.json.status, "ACCEPTED");
  assert.ok(res.json.deal_id);
});

test("POST /deals/from-request rejects duplicate request_id", async () => {
  const token = await makeUserToken();

  const payload = {
    request_id: `req-${Date.now()}-dup`,
    buyer_id: "buyer-1",
    supplier_id: "supplier-1",
    deal_title: "Test Deal",
    currency: "USD"
  };

  const first = await send(token, payload);
  assert.equal(first.status, 201);

  const second = await send(token, payload);
  assert.equal(second.status, 409);
  assert.equal(second.json.reason, "REQUEST_ALREADY_LINKED");
});

test("POST /deals/from-request rejects invalid payload", async () => {
  const token = await makeUserToken();

  const res = await send(token, {
    request_id: "",
    buyer_id: "",
    supplier_id: "",
    deal_title: "",
    currency: ""
  });

  assert.equal(res.status, 400);
  assert.equal(res.json.reason, "INVALID_REQUEST_PAYLOAD");
});