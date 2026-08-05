import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { Server } from "node:http";
import { createApp } from "../../services/auth-api/src/app";
import { env } from "../../services/auth-api/src/config/env";
import { pool } from "../../services/auth-api/src/db/pool";
import {
  hashEmailVerificationToken
} from "../../services/auth-api/src/services/email-verification-token.service";

type JsonObject = Record<string, unknown>;

type HttpResult = {
  status: number;
  body: JsonObject;
};

type RegisteredTestUser = {
  email: string;
  username: string;
  password: string;
  rawVerificationToken: string;
  verificationUrl: string;
  response: HttpResult;
};

type DevelopmentEmailLog = {
  recipientEmail: string;
  locale: "ar" | "en";
  subject: string;
  verificationUrl: string;
};

const TEST_PASSWORD = "AuthTest12345";

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function closeServer(
  server: Server
): Promise<void> {
  if (!server.listening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

test(
  "Auth API email verification, roles, resend, and refresh flow",
  async (context) => {
    assert.equal(
      process.env.AUTH_TEST_ALLOW_DATABASE_MUTATION,
      "true",
      [
        "Auth integration tests modify app_auth test records.",
        "Set AUTH_TEST_ALLOW_DATABASE_MUTATION=true only for a local",
        "or dedicated test database."
      ].join(" ")
    );

    assert.notEqual(
      env.nodeEnv,
      "production",
      "Auth integration tests must never run with NODE_ENV=production"
    );

    assert.equal(
      env.emailProvider,
      "development",
      "Auth integration tests require EMAIL_PROVIDER=development"
    );

    assert.ok(
      env.emailVerificationResendMaxRequests >= 3,
      [
        "EMAIL_VERIFICATION_RESEND_MAX_REQUESTS must be at least 3",
        "for the rate-limit integration scenario."
      ].join(" ")
    );

    const testStartedAt = new Date().toISOString();
    const suffix = [
      Date.now().toString(36),
      randomUUID()
        .replace(/-/g, "")
        .slice(0, 8)
    ].join("");

    const createdEmails = new Set<string>();
    const verificationUrls =
      new Map<string, string>();

    const originalConsoleInfo = console.info;

    console.info = (
      message?: unknown,
      ...optionalParams: unknown[]
    ): void => {
      if (
        message ===
        "AUTH_DEVELOPMENT_VERIFICATION_EMAIL"
      ) {
        const payload = optionalParams[0];

        if (
          isRecord(payload) &&
          typeof payload.recipientEmail === "string" &&
          typeof payload.verificationUrl === "string"
        ) {
          const emailLog =
            payload as unknown as DevelopmentEmailLog;

          verificationUrls.set(
            emailLog.recipientEmail.toLowerCase(),
            emailLog.verificationUrl
          );
        }

        return;
      }

      originalConsoleInfo(
        message,
        ...optionalParams
      );
    };

    const app = createApp();

    const server = app.listen(
      0,
      "127.0.0.1"
    );

    await once(server, "listening");

    const address = server.address();

    assert.ok(
      address &&
      typeof address === "object"
    );

    const baseUrl =
      `http://127.0.0.1:${(address as AddressInfo).port}`;

    async function requestJson(
      pathname: string,
      init: RequestInit = {}
    ): Promise<HttpResult> {
      const headers = new Headers(init.headers);

      if (
        init.body !== undefined &&
        !headers.has("content-type")
      ) {
        headers.set(
          "content-type",
          "application/json"
        );
      }

      const response = await fetch(
        `${baseUrl}${pathname}`,
        {
          ...init,
          headers
        }
      );

      const body = await response
        .json() as JsonObject;

      return {
        status: response.status,
        body
      };
    }

    function extractVerificationToken(
      email: string
    ): {
      rawToken: string;
      verificationUrl: string;
    } {
      const verificationUrl =
        verificationUrls.get(
          email.toLowerCase()
        );

      assert.ok(
        verificationUrl,
        `No development verification URL was captured for ${email}`
      );

      const parsedUrl = new URL(
        verificationUrl
      );

      const rawToken =
        parsedUrl.searchParams.get(
          "token"
        );

      assert.ok(
        rawToken,
        `Verification URL for ${email} does not contain a token`
      );

      return {
        rawToken,
        verificationUrl
      };
    }

    async function registerUser(params: {
      label: string;
      role: "client" | "supplier";
      locale?: "ar" | "en";
    }): Promise<RegisteredTestUser> {
      const username = [
        params.label,
        suffix
      ]
        .join("_")
        .toLowerCase()
        .slice(0, 32);

      const email =
        `${params.label}.${suffix}@example.test`
          .toLowerCase();

      createdEmails.add(email);
      verificationUrls.delete(email);

      const response = await requestJson(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            username,
            email,
            password: TEST_PASSWORD,
            role: params.role,
            locale: params.locale ?? "en"
          })
        }
      );

      assert.equal(
        response.status,
        201
      );

      assert.equal(
        response.body.status,
        "PENDING_EMAIL_VERIFICATION"
      );

      assert.ok(
        isRecord(response.body.user)
      );

      assert.equal(
        response.body.user.role,
        params.role
      );

      assert.equal(
        response.body.user.email,
        email
      );

      assert.equal(
        response.body.user.username,
        username
      );

      const {
        rawToken,
        verificationUrl
      } = extractVerificationToken(email);

      return {
        email,
        username,
        password: TEST_PASSWORD,
        rawVerificationToken: rawToken,
        verificationUrl,
        response
      };
    }

    async function verifyUser(
      user: RegisteredTestUser
    ): Promise<HttpResult> {
      return requestJson(
        "/auth/email-verification/verify",
        {
          method: "POST",
          body: JSON.stringify({
            token:
              user.rawVerificationToken
          })
        }
      );
    }

    async function cleanup(): Promise<void> {
      const emails = [...createdEmails];

      if (emails.length > 0) {
        const userResult =
          await pool.query<{
            id: string;
          }>(
            `
              SELECT id
              FROM app_auth.users
              WHERE email = ANY($1::TEXT[])
            `,
            [emails]
          );

        const userIds =
          userResult.rows.map(
            (row) => row.id
          );

        if (userIds.length > 0) {
          await pool.query(
            `
              DELETE FROM app_auth.audit_log
              WHERE user_id = ANY($1::UUID[])
            `,
            [userIds]
          );

          await pool.query(
            `
              DELETE FROM app_auth.users
              WHERE id = ANY($1::UUID[])
            `,
            [userIds]
          );
        }
      }

      await pool.query(
        `
          DELETE FROM app_auth.audit_log
          WHERE user_id IS NULL
            AND created_at >= $1
            AND event_type IN (
              'EMAIL_VERIFICATION_FAILED',
              'EMAIL_VERIFICATION_RESEND_ACCEPTED'
            )
        `,
        [testStartedAt]
      );
    }

    try {
      await context.test(
        "registers a client as unverified and stores only the token hash",
        async () => {
          const client = await registerUser({
            label: "client_primary",
            role: "client",
            locale: "en"
          });

          const dbResult =
            await pool.query<{
              id: string;
              username: string;
              email_verified_at: string | null;
              role: string;
              token_hash: string;
            }>(
              `
                SELECT
                  u.id,
                  u.username,
                  u.email_verified_at,
                  r.role,
                  t.token_hash
                FROM app_auth.users u
                JOIN app_auth.user_roles r
                  ON r.user_id = u.id
                JOIN app_auth.email_verification_tokens t
                  ON t.user_id = u.id
                WHERE u.email = $1
                  AND t.consumed_at IS NULL
                  AND t.revoked_at IS NULL
                ORDER BY t.created_at DESC
                LIMIT 1
              `,
              [client.email]
            );

          assert.equal(
            dbResult.rowCount,
            1
          );

          const row = dbResult.rows[0];

          assert.equal(
            row.username,
            client.username
          );

          assert.equal(
            row.role,
            "client"
          );

          assert.equal(
            row.email_verified_at,
            null
          );

          assert.equal(
            row.token_hash,
            hashEmailVerificationToken(
              client.rawVerificationToken
            )
          );

          assert.notEqual(
            row.token_hash,
            client.rawVerificationToken
          );

          assert.match(
            row.token_hash,
            /^[0-9a-f]{64}$/
          );

          const loginBeforeVerification =
            await requestJson(
              "/auth/login",
              {
                method: "POST",
                body: JSON.stringify({
                  identifier:
                    client.username,
                  password:
                    client.password,
                  expected_role:
                    "client"
                })
              }
            );

          assert.equal(
            loginBeforeVerification.status,
            403
          );

          assert.equal(
            loginBeforeVerification.body.status,
            "REJECTED"
          );

          assert.equal(
            loginBeforeVerification.body.reason,
            "EMAIL_NOT_VERIFIED"
          );

          const verifyResult =
            await verifyUser(client);

          assert.equal(
            verifyResult.status,
            200
          );

          assert.equal(
            verifyResult.body.status,
            "VERIFIED"
          );

          const secondVerification =
            await verifyUser(client);

          assert.equal(
            secondVerification.status,
            409
          );

          assert.equal(
            secondVerification.body.reason,
            "EMAIL_VERIFICATION_TOKEN_CONSUMED"
          );

          const loginResult =
            await requestJson(
              "/auth/login",
              {
                method: "POST",
                body: JSON.stringify({
                  identifier:
                    client.username,
                  password:
                    client.password,
                  expected_role:
                    "client"
                })
              }
            );

          assert.equal(
            loginResult.status,
            200
          );

          assert.equal(
            loginResult.body.user &&
            isRecord(loginResult.body.user)
              ? loginResult.body.user.role
              : null,
            "client"
          );

          assert.equal(
            typeof loginResult.body.access_token,
            "string"
          );

          assert.equal(
            typeof loginResult.body.refresh_token,
            "string"
          );

          const accessToken =
            loginResult.body.access_token;

          const refreshToken =
            loginResult.body.refresh_token;

          assert.equal(
            typeof accessToken,
            "string"
          );

          assert.equal(
            typeof refreshToken,
            "string"
          );

          const meResult =
            await requestJson(
              "/auth/me",
              {
                headers: {
                  authorization:
                    `Bearer ${accessToken}`
                }
              }
            );

          assert.equal(
            meResult.status,
            200
          );

          assert.equal(
            meResult.body.username,
            client.username
          );

          assert.equal(
            meResult.body.email,
            client.email
          );

          assert.equal(
            meResult.body.role,
            "client"
          );

          assert.equal(
            typeof meResult.body.email_verified_at,
            "string"
          );

          const mismatchResult =
            await requestJson(
              "/auth/login",
              {
                method: "POST",
                body: JSON.stringify({
                  identifier:
                    client.email,
                  password:
                    client.password,
                  expected_role:
                    "supplier"
                })
              }
            );

          assert.equal(
            mismatchResult.status,
            403
          );

          assert.equal(
            mismatchResult.body.reason,
            "ROLE_MISMATCH"
          );

          const refreshResult =
            await requestJson(
              "/auth/refresh",
              {
                method: "POST",
                body: JSON.stringify({
                  refresh_token:
                    refreshToken
                })
              }
            );

          assert.equal(
            refreshResult.status,
            200
          );

          assert.equal(
            typeof refreshResult.body.access_token,
            "string"
          );

          assert.equal(
            typeof refreshResult.body.refresh_token,
            "string"
          );

          assert.notEqual(
            refreshResult.body.refresh_token,
            refreshToken
          );

          const reusedRefreshResult =
            await requestJson(
              "/auth/refresh",
              {
                method: "POST",
                body: JSON.stringify({
                  refresh_token:
                    refreshToken
                })
              }
            );

          assert.equal(
            reusedRefreshResult.status,
            401
          );

          assert.equal(
            reusedRefreshResult.body.reason,
            "REFRESH_TOKEN_REVOKED"
          );
        }
      );

      await context.test(
        "registers and authenticates a supplier only through the supplier role",
        async () => {
          const supplier =
            await registerUser({
              label: "supplier_primary",
              role: "supplier",
              locale: "ar"
            });

          const roleResult =
            await pool.query<{
              role: string;
              email_verified_at:
                string | null;
            }>(
              `
                SELECT
                  r.role,
                  u.email_verified_at
                FROM app_auth.users u
                JOIN app_auth.user_roles r
                  ON r.user_id = u.id
                WHERE u.email = $1
                LIMIT 1
              `,
              [supplier.email]
            );

          assert.equal(
            roleResult.rows[0].role,
            "supplier"
          );

          assert.equal(
            roleResult.rows[0]
              .email_verified_at,
            null
          );

          const verifyResult =
            await verifyUser(supplier);

          assert.equal(
            verifyResult.status,
            200
          );

          const supplierLogin =
            await requestJson(
              "/auth/login",
              {
                method: "POST",
                body: JSON.stringify({
                  identifier:
                    supplier.email,
                  password:
                    supplier.password,
                  expected_role:
                    "supplier"
                })
              }
            );

          assert.equal(
            supplierLogin.status,
            200
          );

          assert.equal(
            supplierLogin.body.user &&
            isRecord(supplierLogin.body.user)
              ? supplierLogin.body.user.role
              : null,
            "supplier"
          );

          const clientMismatch =
            await requestJson(
              "/auth/login",
              {
                method: "POST",
                body: JSON.stringify({
                  identifier:
                    supplier.username,
                  password:
                    supplier.password,
                  expected_role:
                    "client"
                })
              }
            );

          assert.equal(
            clientMismatch.status,
            403
          );

          assert.equal(
            clientMismatch.body.reason,
            "ROLE_MISMATCH"
          );
        }
      );

      await context.test(
        "rejects invalid and expired verification tokens",
        async () => {
          const invalidResult =
            await requestJson(
              "/auth/email-verification/verify",
              {
                method: "POST",
                body: JSON.stringify({
                  token:
                    "invalid-token-value-long-enough-for-validation-12345"
                })
              }
            );

          assert.equal(
            invalidResult.status,
            400
          );

          assert.equal(
            invalidResult.body.reason,
            "EMAIL_VERIFICATION_TOKEN_INVALID"
          );

          const expiredUser =
            await registerUser({
              label: "expired_token",
              role: "client"
            });

          await pool.query(
            `
              UPDATE app_auth.email_verification_tokens t
              SET
                created_at =
                  NOW() - INTERVAL '2 hours',
                expires_at =
                  NOW() - INTERVAL '1 hour'
              FROM app_auth.users u
              WHERE t.user_id = u.id
                AND u.email = $1
                AND t.consumed_at IS NULL
                AND t.revoked_at IS NULL
            `,
            [expiredUser.email]
          );

          const expiredResult =
            await verifyUser(expiredUser);

          assert.equal(
            expiredResult.status,
            410
          );

          assert.equal(
            expiredResult.body.reason,
            "EMAIL_VERIFICATION_TOKEN_EXPIRED"
          );
        }
      );

      await context.test(
        "resend stays generic, revokes the old token, and enforces IP rate limiting",
        async () => {
          const resendUser =
            await registerUser({
              label: "resend_user",
              role: "client"
            });

          const originalTokenResult =
            await pool.query<{
              id: string;
              token_hash: string;
            }>(
              `
                SELECT
                  t.id,
                  t.token_hash
                FROM app_auth.email_verification_tokens t
                JOIN app_auth.users u
                  ON u.id = t.user_id
                WHERE u.email = $1
                  AND t.consumed_at IS NULL
                  AND t.revoked_at IS NULL
                ORDER BY t.created_at DESC
                LIMIT 1
              `,
              [resendUser.email]
            );

          const originalToken =
            originalTokenResult.rows[0];

          assert.ok(originalToken);

          await pool.query(
            `
              UPDATE app_auth.email_verification_tokens
              SET created_at =
                NOW() - make_interval(
                  secs => $2::INTEGER
                )
              WHERE id = $1
            `,
            [
              originalToken.id,
              env.emailVerificationResendCooldownSeconds +
                1
            ]
          );

          verificationUrls.delete(
            resendUser.email
          );

          const existingAccountResult =
            await requestJson(
              "/auth/email-verification/resend",
              {
                method: "POST",
                body: JSON.stringify({
                  email: resendUser.email,
                  locale: "en"
                })
              }
            );

          assert.equal(
            existingAccountResult.status,
            202
          );

          assert.equal(
            existingAccountResult.body.status,
            "ACCEPTED"
          );

          const resentToken =
            extractVerificationToken(
              resendUser.email
            );

          assert.notEqual(
            resentToken.rawToken,
            resendUser.rawVerificationToken
          );

          const tokenRows =
            await pool.query<{
              id: string;
              token_hash: string;
              revoked_at: string | null;
              consumed_at: string | null;
            }>(
              `
                SELECT
                  t.id,
                  t.token_hash,
                  t.revoked_at,
                  t.consumed_at
                FROM app_auth.email_verification_tokens t
                JOIN app_auth.users u
                  ON u.id = t.user_id
                WHERE u.email = $1
                ORDER BY t.created_at ASC
              `,
              [resendUser.email]
            );

          assert.equal(
            tokenRows.rowCount,
            2
          );

          const oldTokenRow =
            tokenRows.rows.find(
              (row) =>
                row.id ===
                originalToken.id
            );

          const newTokenRow =
            tokenRows.rows.find(
              (row) =>
                row.id !==
                originalToken.id
            );

          assert.ok(oldTokenRow);
          assert.ok(newTokenRow);

          assert.equal(
            typeof oldTokenRow.revoked_at,
            "string"
          );

          assert.equal(
            newTokenRow.revoked_at,
            null
          );

          assert.equal(
            newTokenRow.consumed_at,
            null
          );

          assert.equal(
            newTokenRow.token_hash,
            hashEmailVerificationToken(
              resentToken.rawToken
            )
          );

          const unknownEmail =
            `missing.${suffix}@example.test`;

          const missingAccountResult =
            await requestJson(
              "/auth/email-verification/resend",
              {
                method: "POST",
                body: JSON.stringify({
                  email: unknownEmail,
                  locale: "en"
                })
              }
            );

          assert.equal(
            missingAccountResult.status,
            202
          );

          assert.deepEqual(
            missingAccountResult.body,
            existingAccountResult.body
          );

          const requestsAlreadyUsed = 2;

          for (
            let requestNumber =
              requestsAlreadyUsed;
            requestNumber <
            env.emailVerificationResendMaxRequests;
            requestNumber += 1
          ) {
            const acceptedResult =
              await requestJson(
                "/auth/email-verification/resend",
                {
                  method: "POST",
                  body: JSON.stringify({
                    email:
                      `missing-${requestNumber}.${suffix}@example.test`,
                    locale: "en"
                  })
                }
              );

            assert.equal(
              acceptedResult.status,
              202
            );
          }

          const rateLimitedResult =
            await requestJson(
              "/auth/email-verification/resend",
              {
                method: "POST",
                body: JSON.stringify({
                  email:
                    `rate-limited.${suffix}@example.test`,
                  locale: "en"
                })
              }
            );

          assert.equal(
            rateLimitedResult.status,
            429
          );

          assert.equal(
            rateLimitedResult.body.status,
            "REJECTED"
          );

          assert.equal(
            rateLimitedResult.body.reason,
            "EMAIL_VERIFICATION_RESEND_RATE_LIMITED"
          );
        }
      );
    } finally {
      console.info = originalConsoleInfo;

      try {
        await cleanup();
      } finally {
        await closeServer(server);
        await pool.end();
      }
    }
  }
);
