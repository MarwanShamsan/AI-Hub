import {
  createHash,
  randomUUID
} from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import {
  isPostgresError,
  isUniqueViolation,
  type DbExecutor,
  withTransaction
} from "../db/pool";
import { AuthError } from "../errors/auth.error";
import {
  getEmailVerificationMailer,
  getPasswordResetMailer
} from "../mailers";
import {
  createEmailVerificationToken,
  consumeEmailVerificationToken,
  countEmailVerificationTokensCreatedSince,
  findEmailVerificationTokenByHashForUpdate,
  findLatestEmailVerificationTokenForUser,
  revokeActiveEmailVerificationTokens,
  revokeEmailVerificationToken
} from "../repositories/email-verification.repository";
import {
  createUser,
  createUserRole,
  type DbUser,
  type DbUserRole,
  findPrimaryRoleByUserId,
  findRefreshTokenByHash,
  findRefreshTokenByHashForUpdate,
  findUserByEmail,
  findUserByEmailForUpdate,
  findUserById,
  findUserByIdentifier,
  findUserByUsername,
  insertAuditLog,
  insertRefreshToken,
  markEmailVerified,
  revokeRefreshToken,
  updateLastLoginAt,
  findUserByIdForUpdate,
  revokeAllRefreshTokens,
  updatePasswordHash,
} from "../repositories/user.repository";
import {
  generatePasswordResetToken,
  hashPasswordResetToken
} from "./password-reset-token.service";
import {
  generateEmailVerificationToken,
  hashEmailVerificationToken
} from "./email-verification-token.service";
import {
  type AuthLocale,
  type AuthRole,
  type AuthUser,
  type LoginResult,
  type LoginServiceInput,
  type PublicAuthRole,
  type RefreshServiceInput,
  type RegisterResult,
  type RegisterServiceInput,
  type ResendEmailVerificationResult,
  type ResendEmailVerificationServiceInput,
  type RequestContext,
  type VerifyEmailInput,
  type VerifyEmailResult,
  type ConfirmPasswordResetResult,
  type ConfirmPasswordResetServiceInput,
  type RequestPasswordResetResult,
  type RequestPasswordResetServiceInput,
} from "../types/auth";
import {
  comparePassword,
  hashPassword
} from "../utils/password";
import {
  type AuthJwtPayload,
  getTokenExpirationIso,
  signAccessToken,
  signRefreshToken,
  verifyToken
} from "../utils/jwt";
import {
  consumePasswordResetToken,
  countPasswordResetTokensCreatedSince,
  createPasswordResetToken,
  findLatestPasswordResetTokenForUser,
  findPasswordResetTokenByHash,
  findPasswordResetTokenByHashForUpdate,
  revokeActivePasswordResetTokens,
  revokePasswordResetToken
} from "../repositories/password-reset.repository";

const DUMMY_PASSWORD_HASH =
  "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi";

const RESEND_ACCEPTED_MESSAGE =
  "If the account is eligible, a verification message has been sent.";

const PASSWORD_RESET_ACCEPTED_MESSAGE =
  "If the account is eligible, a password reset message has been sent.";
type ActiveUserContext = {
  user: DbUser;
  role: DbUserRole;
};

type VerificationDelivery = {
  userId: string;
  tokenId: string;
  recipientEmail: string;
  recipientName: string | null;
  rawToken: string;
  role: PublicAuthRole;
  locale: AuthLocale;
};

type PasswordResetDelivery = {
  userId: string;
  tokenId: string;
  recipientEmail: string;
  recipientName: string | null;
  rawToken: string;
  role: PublicAuthRole;
  locale: AuthLocale;
};

export async function confirmPasswordReset(
  params: ConfirmPasswordResetServiceInput
): Promise<ConfirmPasswordResetResult> {
  const tokenHash =
    hashPasswordResetToken(
      params.token
    );

  const preliminaryToken =
    await findPasswordResetTokenByHash(
      tokenHash
    );

  if (!preliminaryToken) {
    await writeAuditBestEffort({
      userId: null,

      eventType:
        "PASSWORD_RESET_FAILED",

      metadata: {
        reason:
          "PASSWORD_RESET_TOKEN_INVALID"
      }
    });

    throw new AuthError(
      "PASSWORD_RESET_TOKEN_INVALID"
    );
  }

  /*
   * Hashing is deliberately completed before opening the DB transaction.
   * bcrypt is CPU-intensive and must not extend database lock duration.
   */
  const newPasswordHash =
    await hashPassword(
      params.new_password
    );

  const outcome =
    await withTransaction<
      ConfirmPasswordResetTransactionOutcome
    >(async (client) => {
      /*
       * All reset confirmations for the same user acquire the user lock
       * before locking an individual reset token. This prevents parallel
       * reset links from racing or deadlocking.
       */
      const user =
        await findUserByIdForUpdate(
          preliminaryToken.user_id,
          client
        );

      if (
        !user ||
        user.status !== "ACTIVE" ||
        !user.email_verified_at
      ) {
        return {
          ok: false,

          error: new AuthError(
            "USER_NOT_AVAILABLE"
          )
        };
      }

      const role =
        await findPrimaryRoleByUserId(
          user.id,
          client
        );

      if (
        !role ||
        !isPublicRole(role.role)
      ) {
        return {
          ok: false,

          error: new AuthError(
            "USER_NOT_AVAILABLE"
          )
        };
      }

      const token =
        await findPasswordResetTokenByHashForUpdate(
          tokenHash,
          client
        );

      if (
        !token ||
        token.user_id !== user.id
      ) {
        await insertAuditLog(
          {
            id: uuidv4(),

            userId: user.id,

            eventType:
              "PASSWORD_RESET_FAILED",

            metadata: {
              reason:
                "PASSWORD_RESET_TOKEN_INVALID"
            }
          },
          client
        );

        return {
          ok: false,

          error: new AuthError(
            "PASSWORD_RESET_TOKEN_INVALID"
          )
        };
      }

      if (token.consumed_at) {
        await insertAuditLog(
          {
            id: uuidv4(),

            userId: user.id,

            eventType:
              "PASSWORD_RESET_FAILED",

            metadata: {
              reason:
                "PASSWORD_RESET_TOKEN_CONSUMED",

              token_id: token.id
            }
          },
          client
        );

        return {
          ok: false,

          error: new AuthError(
            "PASSWORD_RESET_TOKEN_CONSUMED"
          )
        };
      }

      if (token.revoked_at) {
        await insertAuditLog(
          {
            id: uuidv4(),

            userId: user.id,

            eventType:
              "PASSWORD_RESET_FAILED",

            metadata: {
              reason:
                "PASSWORD_RESET_TOKEN_INVALID",

              token_id: token.id
            }
          },
          client
        );

        return {
          ok: false,

          error: new AuthError(
            "PASSWORD_RESET_TOKEN_INVALID"
          )
        };
      }

      const expiresAt =
        toEpochMilliseconds(
          token.expires_at
        );

      if (
        Number.isNaN(expiresAt) ||
        expiresAt <= Date.now()
      ) {
        await insertAuditLog(
          {
            id: uuidv4(),

            userId: user.id,

            eventType:
              "PASSWORD_RESET_FAILED",

            metadata: {
              reason:
                "PASSWORD_RESET_TOKEN_EXPIRED",

              token_id: token.id
            }
          },
          client
        );

        return {
          ok: false,

          error: new AuthError(
            "PASSWORD_RESET_TOKEN_EXPIRED"
          )
        };
      }

      const resetAt =
        new Date().toISOString();

      const passwordUpdated =
        await updatePasswordHash(
          {
            userId: user.id,

            passwordHash:
              newPasswordHash
          },
          client
        );

      if (!passwordUpdated) {
        throw new AuthError(
          "REQUEST_FAILED",
          {
            statusCode: 500
          }
        );
      }

      const revokedRefreshTokenCount =
        await revokeAllRefreshTokens(
          {
            userId: user.id,
            revokedAt: resetAt
          },
          client
        );

      const consumed =
        await consumePasswordResetToken(
          {
            tokenId: token.id,
            consumedAt: resetAt
          },
          client
        );

      if (!consumed) {
        throw new AuthError(
          "PASSWORD_RESET_TOKEN_CONSUMED"
        );
      }

      const revokedOtherResetTokens =
        await revokeActivePasswordResetTokens(
          {
            userId: user.id,
            revokedAt: resetAt
          },
          client
        );

      await insertAuditLog(
        {
          id: uuidv4(),

          userId: user.id,

          eventType:
            "PASSWORD_RESET_SUCCESS",

          metadata: {
            role: role.role,

            token_id: token.id,

            refresh_tokens_revoked:
              revokedRefreshTokenCount,

            other_reset_tokens_revoked:
              revokedOtherResetTokens,

            user_agent:
              params.userAgent,

            ip_address:
              params.ipAddress
          }
        },
        client
      );

      return {
        ok: true,

        result: {
          status:
            "PASSWORD_RESET"
        }
      };
    });

  if (!outcome.ok) {
    throw outcome.error;
  }

  return outcome.result;
}

type ConfirmPasswordResetTransactionOutcome =
  | {
      ok: true;
      result: ConfirmPasswordResetResult;
    }
  | {
      ok: false;
      error: AuthError;
    };

type VerifyEmailTransactionOutcome =
  | {
      ok: true;
      result: VerifyEmailResult;
    }
  | {
      ok: false;
      error: AuthError;
    };

function hashOpaqueToken(token: string): string {
  return createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

function isPublicRole(role: AuthRole): role is PublicAuthRole {
  return role === "client" || role === "supplier";
}

function toIsoString(value: string | Date | null): string | null {
  if (value === null) {
    return null;
  }

  const date = value instanceof Date
    ? value
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AuthError("REQUEST_FAILED", {
      statusCode: 500
    });
  }

  return date.toISOString();
}

function toEpochMilliseconds(value: string | Date): number {
  const date = value instanceof Date
    ? value
    : new Date(value);

  return date.getTime();
}

function buildJwtPayload(
  user: DbUser,
  role: DbUserRole
): AuthJwtPayload {
  return {
    sub: user.id,
    actor_type: "USER",
    tenant_id: user.tenant_id,
    role: role.role,
    agent_id: role.agent_id
  };
}

function buildAuthUser(
  user: DbUser,
  role: DbUserRole
): AuthUser {
  return {
    sub: user.id,
    actor_type: "USER",
    tenant_id: user.tenant_id,
    role: role.role,
    agent_id: role.agent_id,
    username: user.username,
    email: user.email,
    email_verified_at: toIsoString(
      user.email_verified_at
    )
  };
}

function buildInternalAdminUsername(email: string): string {
  const suffix = createHash("sha256")
    .update(email, "utf8")
    .digest("hex")
    .slice(0, 20);

  return `admin_${suffix}`;
}

function buildVerificationUrl(
  rawToken: string,
  role: PublicAuthRole,
  locale: AuthLocale
): string {
  const appUrl =
    role === "client"
      ? env.clientAppUrl
      : env.supplierAppUrl;

  const url = new URL(
    "/verify-email",
    `${appUrl}/`
  );

  url.searchParams.set("token", rawToken);
  url.searchParams.set("account", role);
  url.searchParams.set("locale", locale);

  return url.toString();
}

function buildPasswordResetUrl(
  rawToken: string,
  role: PublicAuthRole,
  locale: AuthLocale
): string {
  const appUrl =
    role === "client"
      ? env.clientAppUrl
      : env.supplierAppUrl;

  const url = new URL(
    "/reset-password",
    `${appUrl}/`
  );

  url.searchParams.set(
    "token",
    rawToken
  );

  url.searchParams.set(
    "account",
    role
  );

  url.searchParams.set(
    "locale",
    locale
  );

  return url.toString();
}

function mapUniqueViolation(error: unknown): AuthError | null {
  if (!isUniqueViolation(error)) {
    return null;
  }

  const constraint = isPostgresError(error)
    ? error.constraint?.toLowerCase() ?? ""
    : "";

  if (constraint.includes("username")) {
    return new AuthError(
      "USERNAME_ALREADY_EXISTS"
    );
  }

  if (constraint.includes("email")) {
    return new AuthError(
      "EMAIL_ALREADY_EXISTS"
    );
  }

  return new AuthError("REQUEST_FAILED", {
    statusCode: 409
  });
}

function isJwtExpiredError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ERR_JWT_EXPIRED"
  );
}

async function writeAuditBestEffort(params: {
  userId: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  try {
    await insertAuditLog({
      id: uuidv4(),
      userId: params.userId,
      eventType: params.eventType,
      metadata: params.metadata
    });
  } catch (error) {
    console.error("AUTH_AUDIT_WRITE_FAILED", {
      eventType: params.eventType,
      errorName:
        error instanceof Error
          ? error.name
          : "UnknownError"
    });
  }
}

async function getActiveUserContext(
  userId: string,
  executor?: DbExecutor
): Promise<ActiveUserContext | null> {
  const user = await findUserById(
    userId,
    executor
  );

  if (
    !user ||
    user.status !== "ACTIVE" ||
    !user.email_verified_at
  ) {
    return null;
  }

  const role = await findPrimaryRoleByUserId(
    user.id,
    executor
  );

  if (!role) {
    return null;
  }

  return {
    user,
    role
  };
}

async function issueTokens(
  context: ActiveUserContext,
  requestContext: RequestContext,
  executor: DbExecutor
): Promise<LoginResult> {
  const jwtPayload = buildJwtPayload(
    context.user,
    context.role
  );

  const accessToken = await signAccessToken(
    jwtPayload
  );

  const refreshToken = await signRefreshToken({
    ...jwtPayload,
    jti: randomUUID()
  });

  const refreshTokenExpiresAt =
    await getTokenExpirationIso(refreshToken);

  await insertRefreshToken(
    {
      id: uuidv4(),
      userId: context.user.id,
      tokenHash: hashOpaqueToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
      userAgent: requestContext.userAgent,
      ipAddress: requestContext.ipAddress
    },
    executor
  );

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: buildAuthUser(
      context.user,
      context.role
    )
  };
}

async function deliverVerificationEmail(
  delivery: VerificationDelivery
): Promise<void> {
  try {
    const mailer = getEmailVerificationMailer();

    await mailer.sendVerificationEmail({
      recipientEmail: delivery.recipientEmail,
      recipientName: delivery.recipientName,
      verificationUrl: buildVerificationUrl(
        delivery.rawToken,
        delivery.role,
        delivery.locale
      ),
      locale: delivery.locale
    });
  } catch (error) {
    try {
      await withTransaction(async (client) => {
        await revokeEmailVerificationToken(
          {
            tokenId: delivery.tokenId,
            revokedAt: new Date().toISOString()
          },
          client
        );

        await insertAuditLog(
          {
            id: uuidv4(),
            userId: delivery.userId,
            eventType:
              "EMAIL_VERIFICATION_DELIVERY_FAILED",
            metadata: {
              provider: env.emailProvider
            }
          },
          client
        );
      });
    } catch (auditError) {
      console.error(
        "EMAIL_VERIFICATION_FAILURE_AUDIT_FAILED",
        {
          userId: delivery.userId,
          tokenId: delivery.tokenId,
          errorName:
            auditError instanceof Error
              ? auditError.name
              : "UnknownError"
        }
      );
    }

    console.error(
      "EMAIL_VERIFICATION_DELIVERY_FAILED",
      {
        userId: delivery.userId,
        tokenId: delivery.tokenId,
        provider: env.emailProvider,
        errorName:
          error instanceof Error
            ? error.name
            : "UnknownError"
      }
    );
  }
}

async function deliverPasswordResetEmail(
  delivery: PasswordResetDelivery
): Promise<void> {
  try {
    const mailer =
      getPasswordResetMailer();

    await mailer.sendPasswordResetEmail({
      recipientEmail:
        delivery.recipientEmail,

      recipientName:
        delivery.recipientName,

      resetUrl:
        buildPasswordResetUrl(
          delivery.rawToken,
          delivery.role,
          delivery.locale
        ),

      locale: delivery.locale
    });
  } catch (error) {
    try {
      await withTransaction(
        async (client) => {
          await revokePasswordResetToken(
            {
              tokenId:
                delivery.tokenId,

              revokedAt:
                new Date().toISOString()
            },
            client
          );

          await insertAuditLog(
            {
              id: uuidv4(),

              userId:
                delivery.userId,

              eventType:
                "PASSWORD_RESET_DELIVERY_FAILED",

              metadata: {
                provider:
                  env.emailProvider
              }
            },
            client
          );
        }
      );
    } catch (auditError) {
      console.error(
        "PASSWORD_RESET_FAILURE_AUDIT_FAILED",
        {
          userId:
            delivery.userId,

          tokenId:
            delivery.tokenId,

          errorName:
            auditError instanceof Error
              ? auditError.name
              : "UnknownError"
        }
      );
    }

    console.error(
      "PASSWORD_RESET_DELIVERY_FAILED",
      {
        userId:
          delivery.userId,

        tokenId:
          delivery.tokenId,

        provider:
          env.emailProvider,

        errorName:
          error instanceof Error
            ? error.name
            : "UnknownError"
      }
    );
  }
}

export async function register(
  params: RegisterServiceInput
): Promise<RegisterResult> {
  const email = normalizeEmail(params.email);
  const username = params.username
    .trim()
    .toLowerCase();

  const existingEmail = await findUserByEmail(
    email
  );

  if (existingEmail) {
    throw new AuthError(
      "EMAIL_ALREADY_EXISTS"
    );
  }

  const existingUsername =
    await findUserByUsername(username);

  if (existingUsername) {
    throw new AuthError(
      "USERNAME_ALREADY_EXISTS"
    );
  }

  const userId = uuidv4();
  const tokenId = uuidv4();
  const passwordHash = await hashPassword(
    params.password
  );

  const verification =
    generateEmailVerificationToken();

  let createdUser: DbUser;

  try {
    createdUser = await withTransaction(
      async (client) => {
        const user = await createUser(
          {
            id: userId,
            username,
            email,
            passwordHash,
            status: "ACTIVE",
            tenantId: `tenant-${userId}`,
            emailVerifiedAt: null
          },
          client
        );

        await createUserRole(
          {
            id: uuidv4(),
            userId,
            role: params.role,
            agentId: null
          },
          client
        );

        await createEmailVerificationToken(
          {
            id: tokenId,
            userId,
            tokenHash:
              verification.tokenHash,
            expiresAt:
              verification.expiresAt
          },
          client
        );

        await insertAuditLog(
          {
            id: uuidv4(),
            userId,
            eventType: "REGISTER_SUCCESS",
            metadata: {
              email,
              username,
              role: params.role,
              email_verified: false
            }
          },
          client
        );

        return user;
      }
    );
  } catch (error) {
    const uniqueError =
      mapUniqueViolation(error);

    if (uniqueError) {
      throw uniqueError;
    }

    throw error;
  }

  await deliverVerificationEmail({
    userId,
    tokenId,
    recipientEmail: createdUser.email,
    recipientName: createdUser.username,
    rawToken: verification.rawToken,
    role: params.role,
    locale: params.locale
  });

  return {
    status: "PENDING_EMAIL_VERIFICATION",
    user: {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      role: params.role
    }
  };
}

export async function createInternalAdmin(params: {
  email: string;
  password: string;
  tenantId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<LoginResult> {
  const email = normalizeEmail(params.email);

  const existingUser = await findUserByEmail(
    email
  );

  if (existingUser) {
    throw new AuthError(
      "EMAIL_ALREADY_EXISTS"
    );
  }

  const userId = uuidv4();
  const username =
    buildInternalAdminUsername(email);

  const passwordHash = await hashPassword(
    params.password
  );

  try {
    return await withTransaction(
      async (client) => {
        const user = await createUser(
          {
            id: userId,
            username,
            email,
            passwordHash,
            status: "ACTIVE",
            tenantId:
              params.tenantId?.trim() ||
              "internal-admin-tenant",
            emailVerifiedAt:
              new Date().toISOString()
          },
          client
        );

        const role = await createUserRole(
          {
            id: uuidv4(),
            userId,
            role: "admin",
            agentId: null
          },
          client
        );

        const result = await issueTokens(
          {
            user,
            role
          },
          {
            userAgent:
              params.userAgent ??
              "internal-bootstrap",
            ipAddress:
              params.ipAddress ?? null
          },
          client
        );

        await updateLastLoginAt(
          userId,
          client
        );

        await insertAuditLog(
          {
            id: uuidv4(),
            userId,
            eventType:
              "ADMIN_BOOTSTRAP_SUCCESS",
            metadata: {
              email,
              username
            }
          },
          client
        );

        return result;
      }
    );
  } catch (error) {
    const uniqueError =
      mapUniqueViolation(error);

    if (uniqueError) {
      throw uniqueError;
    }

    throw error;
  }
}

export async function login(
  params: LoginServiceInput
): Promise<LoginResult> {
  const identifier = normalizeIdentifier(
    params.identifier
  );

  const user = await findUserByIdentifier(
    identifier
  );

  if (!user || user.status !== "ACTIVE") {
    await comparePassword(
      params.password,
      DUMMY_PASSWORD_HASH
    );

    await writeAuditBestEffort({
      userId: user?.id ?? null,
      eventType: "LOGIN_FAILED",
      metadata: {
        identifier,
        reason: "INVALID_CREDENTIALS"
      }
    });

    throw new AuthError(
      "INVALID_CREDENTIALS"
    );
  }

  const passwordValid = await comparePassword(
    params.password,
    user.password_hash
  );

  if (!passwordValid) {
    await writeAuditBestEffort({
      userId: user.id,
      eventType: "LOGIN_FAILED",
      metadata: {
        identifier,
        reason: "INVALID_CREDENTIALS"
      }
    });

    throw new AuthError(
      "INVALID_CREDENTIALS"
    );
  }

  const role = await findPrimaryRoleByUserId(
    user.id
  );

  if (!role) {
    throw new AuthError(
      "USER_NOT_AVAILABLE"
    );
  }

  if (role.role !== params.expected_role) {
    await writeAuditBestEffort({
      userId: user.id,
      eventType: "LOGIN_FAILED",
      metadata: {
        expected_role:
          params.expected_role,
        reason: "ROLE_MISMATCH"
      }
    });

    throw new AuthError("ROLE_MISMATCH");
  }

  if (!user.email_verified_at) {
    await writeAuditBestEffort({
      userId: user.id,
      eventType: "LOGIN_FAILED",
      metadata: {
        reason: "EMAIL_NOT_VERIFIED"
      }
    });

    throw new AuthError(
      "EMAIL_NOT_VERIFIED"
    );
  }

  return withTransaction(async (client) => {
    const currentContext =
      await getActiveUserContext(
        user.id,
        client
      );

    if (!currentContext) {
      throw new AuthError(
        "USER_NOT_AVAILABLE"
      );
    }

    if (
      currentContext.role.role !==
      params.expected_role
    ) {
      throw new AuthError(
        "ROLE_MISMATCH"
      );
    }

    const result = await issueTokens(
      currentContext,
      {
        userAgent: params.userAgent,
        ipAddress: params.ipAddress
      },
      client
    );

    await updateLastLoginAt(
      user.id,
      client
    );

    await insertAuditLog(
      {
        id: uuidv4(),
        userId: user.id,
        eventType: "LOGIN_SUCCESS",
        metadata: {
          login_identifier_type:
            identifier.includes("@")
              ? "email"
              : "username",
          role:
            currentContext.role.role
        }
      },
      client
    );

    return result;
  });
}

export async function refresh(
  params: RefreshServiceInput
): Promise<LoginResult> {
  const tokenHash = hashOpaqueToken(
    params.refreshToken
  );

  const preliminaryStoredToken =
    await findRefreshTokenByHash(tokenHash);

  if (!preliminaryStoredToken) {
    throw new AuthError(
      "INVALID_REFRESH_TOKEN"
    );
  }

  if (preliminaryStoredToken.revoked_at) {
    throw new AuthError(
      "REFRESH_TOKEN_REVOKED"
    );
  }

  const preliminaryExpiry =
    toEpochMilliseconds(
      preliminaryStoredToken.expires_at
    );

  if (
    Number.isNaN(preliminaryExpiry) ||
    preliminaryExpiry <= Date.now()
  ) {
    throw new AuthError(
      "REFRESH_TOKEN_EXPIRED"
    );
  }

  let decoded: Awaited<
    ReturnType<typeof verifyToken>
  >;

  try {
    decoded = await verifyToken(
      params.refreshToken
    );
  } catch (error) {
    if (isJwtExpiredError(error)) {
      throw new AuthError(
        "REFRESH_TOKEN_EXPIRED"
      );
    }

    throw new AuthError(
      "INVALID_REFRESH_TOKEN"
    );
  }

  return withTransaction(async (client) => {
    const stored =
      await findRefreshTokenByHashForUpdate(
        tokenHash,
        client
      );

    if (!stored) {
      throw new AuthError(
        "INVALID_REFRESH_TOKEN"
      );
    }

    if (stored.revoked_at) {
      throw new AuthError(
        "REFRESH_TOKEN_REVOKED"
      );
    }

    const expiresAt =
      toEpochMilliseconds(stored.expires_at);

    if (
      Number.isNaN(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      throw new AuthError(
        "REFRESH_TOKEN_EXPIRED"
      );
    }

    if (stored.user_id !== decoded.sub) {
      throw new AuthError(
        "INVALID_REFRESH_TOKEN"
      );
    }

    const context =
      await getActiveUserContext(
        decoded.sub,
        client
      );

    if (!context) {
      throw new AuthError(
        "USER_NOT_AVAILABLE"
      );
    }

    const revoked = await revokeRefreshToken(
      stored.id,
      client
    );

    if (!revoked) {
      throw new AuthError(
        "REFRESH_TOKEN_REVOKED"
      );
    }

    const result = await issueTokens(
      context,
      {
        userAgent: params.userAgent,
        ipAddress: params.ipAddress
      },
      client
    );

    await insertAuditLog(
      {
        id: uuidv4(),
        userId: context.user.id,
        eventType: "REFRESH_SUCCESS",
        metadata: {
          rotated_token_id: stored.id
        }
      },
      client
    );

    return result;
  });
}

export async function verifyEmail(
  params: VerifyEmailInput
): Promise<VerifyEmailResult> {
  const tokenHash =
    hashEmailVerificationToken(
      params.token
    );

  const outcome =
    await withTransaction<VerifyEmailTransactionOutcome>(
      async (client) => {
        const token =
          await findEmailVerificationTokenByHashForUpdate(
            tokenHash,
            client
          );

        if (!token) {
          await insertAuditLog(
            {
              id: uuidv4(),
              userId: null,
              eventType:
                "EMAIL_VERIFICATION_FAILED",
              metadata: {
                reason:
                  "EMAIL_VERIFICATION_TOKEN_INVALID"
              }
            },
            client
          );

          return {
            ok: false,
            error: new AuthError(
              "EMAIL_VERIFICATION_TOKEN_INVALID"
            )
          };
        }

        if (token.consumed_at) {
          const alreadyVerifiedUser =
            await findUserById(
              token.user_id,
              client
            );

          const alreadyVerifiedRole =
            await findPrimaryRoleByUserId(
              token.user_id,
              client
            );

          if (
            alreadyVerifiedUser &&
            alreadyVerifiedUser.status === "ACTIVE" &&
            alreadyVerifiedUser.email_verified_at &&
            alreadyVerifiedRole &&
            isPublicRole(
              alreadyVerifiedRole.role
            )
          ) {
            const verifiedAt =
              toIsoString(
                alreadyVerifiedUser.email_verified_at
              );

            if (!verifiedAt) {
              throw new AuthError(
                "REQUEST_FAILED",
                {
                  statusCode: 500
                }
              );
            }

            await insertAuditLog(
              {
                id: uuidv4(),
                userId:
                  alreadyVerifiedUser.id,
                eventType:
                  "EMAIL_VERIFICATION_IDEMPOTENT_SUCCESS",
                metadata: {
                  token_id: token.id,
                  originally_consumed_at:
                    toIsoString(
                      token.consumed_at
                    )
                }
              },
              client
            );

            return {
              ok: true,
              result: {
                status: "VERIFIED",
                user: {
                  id:
                    alreadyVerifiedUser.id,
                  username:
                    alreadyVerifiedUser.username,
                  email:
                    alreadyVerifiedUser.email,
                  role:
                    alreadyVerifiedRole.role,
                  email_verified_at:
                    verifiedAt
                }
              }
            };
          }

          await insertAuditLog(
            {
              id: uuidv4(),
              userId: token.user_id,
              eventType:
                "EMAIL_VERIFICATION_FAILED",
              metadata: {
                reason:
                  "EMAIL_VERIFICATION_TOKEN_CONSUMED"
              }
            },
            client
          );

          return {
            ok: false,
            error: new AuthError(
              "EMAIL_VERIFICATION_TOKEN_CONSUMED"
            )
          };
        }

        if (token.revoked_at) {
          await insertAuditLog(
            {
              id: uuidv4(),
              userId: token.user_id,
              eventType:
                "EMAIL_VERIFICATION_FAILED",
              metadata: {
                reason:
                  "EMAIL_VERIFICATION_TOKEN_INVALID"
              }
            },
            client
          );

          return {
            ok: false,
            error: new AuthError(
              "EMAIL_VERIFICATION_TOKEN_INVALID"
            )
          };
        }

        const expiresAt =
          toEpochMilliseconds(token.expires_at);

        if (
          Number.isNaN(expiresAt) ||
          expiresAt <= Date.now()
        ) {
          await insertAuditLog(
            {
              id: uuidv4(),
              userId: token.user_id,
              eventType:
                "EMAIL_VERIFICATION_FAILED",
              metadata: {
                reason:
                  "EMAIL_VERIFICATION_TOKEN_EXPIRED"
              }
            },
            client
          );

          return {
            ok: false,
            error: new AuthError(
              "EMAIL_VERIFICATION_TOKEN_EXPIRED"
            )
          };
        }

        const user = await findUserById(
          token.user_id,
          client
        );

        const role =
          await findPrimaryRoleByUserId(
            token.user_id,
            client
          );

        if (
          !user ||
          user.status !== "ACTIVE" ||
          !role ||
          !isPublicRole(role.role)
        ) {
          return {
            ok: false,
            error: new AuthError(
              "USER_NOT_AVAILABLE"
            )
          };
        }

        if (user.email_verified_at) {
          await consumeEmailVerificationToken(
            {
              tokenId: token.id,
              consumedAt:
                new Date().toISOString()
            },
            client
          );

          await insertAuditLog(
            {
              id: uuidv4(),
              userId: user.id,
              eventType:
                "EMAIL_VERIFICATION_ALREADY_COMPLETED",
              metadata: {}
            },
            client
          );

          return {
            ok: false,
            error: new AuthError(
              "EMAIL_ALREADY_VERIFIED"
            )
          };
        }

        const verifiedAt =
          new Date().toISOString();

        const updatedUser =
          await markEmailVerified(
            {
              userId: user.id,
              verifiedAt
            },
            client
          );

        if (!updatedUser) {
          throw new AuthError(
            "REQUEST_FAILED",
            {
              statusCode: 500
            }
          );
        }

        const consumed =
          await consumeEmailVerificationToken(
            {
              tokenId: token.id,
              consumedAt: verifiedAt
            },
            client
          );

        if (!consumed) {
          throw new AuthError(
            "EMAIL_VERIFICATION_TOKEN_CONSUMED"
          );
        }

        await insertAuditLog(
          {
            id: uuidv4(),
            userId: user.id,
            eventType:
              "EMAIL_VERIFICATION_SUCCESS",
            metadata: {
              verified_at: verifiedAt
            }
          },
          client
        );

        return {
          ok: true,
          result: {
            status: "VERIFIED",
            user: {
              id: updatedUser.id,
              username:
                updatedUser.username,
              email: updatedUser.email,
              role: role.role,
              email_verified_at:
                verifiedAt
            }
          }
        };
      }
    );

  if (!outcome.ok) {
    throw outcome.error;
  }

  return outcome.result;
}

export async function resendEmailVerification(
  params: ResendEmailVerificationServiceInput
): Promise<ResendEmailVerificationResult> {
  const email = normalizeEmail(params.email);
  const now = new Date();
  const nowIso = now.toISOString();

  const delivery =
    await withTransaction<VerificationDelivery | null>(
      async (client) => {
        const user =
          await findUserByEmailForUpdate(
            email,
            client
          );

        if (!user) {
          await insertAuditLog(
            {
              id: uuidv4(),
              userId: null,
              eventType:
                "EMAIL_VERIFICATION_RESEND_ACCEPTED",
              metadata: {
                eligible: false,
                reason: "ACCOUNT_NOT_FOUND"
              }
            },
            client
          );

          return null;
        }

        if (
          user.status !== "ACTIVE" ||
          user.email_verified_at
        ) {
          await insertAuditLog(
            {
              id: uuidv4(),
              userId: user.id,
              eventType:
                "EMAIL_VERIFICATION_RESEND_ACCEPTED",
              metadata: {
                eligible: false,
                reason:
                  user.email_verified_at
                    ? "ALREADY_VERIFIED"
                    : "USER_NOT_ACTIVE"
              }
            },
            client
          );

          return null;
        }

        const role =
          await findPrimaryRoleByUserId(
            user.id,
            client
          );

        if (
          !role ||
          !isPublicRole(role.role)
        ) {
          await insertAuditLog(
            {
              id: uuidv4(),
              userId: user.id,
              eventType:
                "EMAIL_VERIFICATION_RESEND_ACCEPTED",
              metadata: {
                eligible: false,
                reason: "ROLE_NOT_ELIGIBLE"
              }
            },
            client
          );

          return null;
        }

        const latestToken =
          await findLatestEmailVerificationTokenForUser(
            user.id,
            client
          );

        if (latestToken) {
          const latestCreatedAt =
            toEpochMilliseconds(
              latestToken.created_at
            );

          const cooldownMilliseconds =
            env.emailVerificationResendCooldownSeconds *
            1000;

          if (
            !Number.isNaN(latestCreatedAt) &&
            now.getTime() - latestCreatedAt <
              cooldownMilliseconds
          ) {
            await insertAuditLog(
              {
                id: uuidv4(),
                userId: user.id,
                eventType:
                  "EMAIL_VERIFICATION_RESEND_SUPPRESSED",
                metadata: {
                  reason: "COOLDOWN_ACTIVE"
                }
              },
              client
            );

            return null;
          }
        }

        const windowStart = new Date(
          now.getTime() -
            env.emailVerificationResendWindowMinutes *
              60 *
              1000
        ).toISOString();

        const tokenCount =
          await countEmailVerificationTokensCreatedSince(
            {
              userId: user.id,
              since: windowStart
            },
            client
          );

        if (
          tokenCount >=
          env.emailVerificationResendMaxRequests
        ) {
          await insertAuditLog(
            {
              id: uuidv4(),
              userId: user.id,
              eventType:
                "EMAIL_VERIFICATION_RESEND_SUPPRESSED",
              metadata: {
                reason: "WINDOW_LIMIT_REACHED"
              }
            },
            client
          );

          return null;
        }

        await revokeActiveEmailVerificationTokens(
          {
            userId: user.id,
            revokedAt: nowIso
          },
          client
        );

        const verification =
          generateEmailVerificationToken(now);

        const tokenId = uuidv4();

        await createEmailVerificationToken(
          {
            id: tokenId,
            userId: user.id,
            tokenHash:
              verification.tokenHash,
            expiresAt:
              verification.expiresAt
          },
          client
        );

        await insertAuditLog(
          {
            id: uuidv4(),
            userId: user.id,
            eventType:
              "EMAIL_VERIFICATION_RESEND_CREATED",
            metadata: {
              locale: params.locale
            }
          },
          client
        );

        return {
          userId: user.id,
          tokenId,
          recipientEmail: user.email,
          recipientName: user.username,
          rawToken: verification.rawToken,
          role: role.role,
          locale: params.locale
        };
      }
    );

  if (delivery) {
    await deliverVerificationEmail(
      delivery
    );
  }

  return {
    status: "ACCEPTED",
    message: RESEND_ACCEPTED_MESSAGE
  };
}

export async function requestPasswordReset(
  params: RequestPasswordResetServiceInput
): Promise<RequestPasswordResetResult> {
  const email =
    normalizeEmail(params.email);

  const now = new Date();
  const nowIso = now.toISOString();

  const delivery =
    await withTransaction<
      PasswordResetDelivery | null
    >(async (client) => {
      const user =
        await findUserByEmailForUpdate(
          email,
          client
        );

      if (!user) {
        await insertAuditLog(
          {
            id: uuidv4(),

            userId: null,

            eventType:
              "PASSWORD_RESET_REQUEST_ACCEPTED",

            metadata: {
              eligible: false,
              reason: "ACCOUNT_NOT_FOUND"
            }
          },
          client
        );

        return null;
      }

      if (
        user.status !== "ACTIVE" ||
        !user.email_verified_at
      ) {
        await insertAuditLog(
          {
            id: uuidv4(),

            userId: user.id,

            eventType:
              "PASSWORD_RESET_REQUEST_ACCEPTED",

            metadata: {
              eligible: false,

              reason:
                user.status !== "ACTIVE"
                  ? "USER_NOT_ACTIVE"
                  : "EMAIL_NOT_VERIFIED"
            }
          },
          client
        );

        return null;
      }

      const role =
        await findPrimaryRoleByUserId(
          user.id,
          client
        );

      if (
        !role ||
        !isPublicRole(role.role)
      ) {
        await insertAuditLog(
          {
            id: uuidv4(),

            userId: user.id,

            eventType:
              "PASSWORD_RESET_REQUEST_ACCEPTED",

            metadata: {
              eligible: false,
              reason: "ROLE_NOT_ELIGIBLE"
            }
          },
          client
        );

        return null;
      }

      const latestToken =
        await findLatestPasswordResetTokenForUser(
          user.id,
          client
        );

      if (latestToken) {
        const latestCreatedAt =
          toEpochMilliseconds(
            latestToken.created_at
          );

        const cooldownMilliseconds =
          env.passwordResetRequestCooldownSeconds *
          1000;

        if (
          !Number.isNaN(
            latestCreatedAt
          ) &&
          now.getTime() -
            latestCreatedAt <
            cooldownMilliseconds
        ) {
          await insertAuditLog(
            {
              id: uuidv4(),

              userId: user.id,

              eventType:
                "PASSWORD_RESET_REQUEST_SUPPRESSED",

              metadata: {
                reason:
                  "COOLDOWN_ACTIVE"
              }
            },
            client
          );

          return null;
        }
      }

      const windowStart =
        new Date(
          now.getTime() -
            env.passwordResetRequestWindowMinutes *
              60 *
              1000
        ).toISOString();

      const tokenCount =
        await countPasswordResetTokensCreatedSince(
          {
            userId: user.id,
            since: windowStart
          },
          client
        );

      if (
        tokenCount >=
        env.passwordResetRequestMaxRequests
      ) {
        await insertAuditLog(
          {
            id: uuidv4(),

            userId: user.id,

            eventType:
              "PASSWORD_RESET_REQUEST_SUPPRESSED",

            metadata: {
              reason:
                "WINDOW_LIMIT_REACHED"
            }
          },
          client
        );

        return null;
      }

      await revokeActivePasswordResetTokens(
        {
          userId: user.id,
          revokedAt: nowIso
        },
        client
      );

      const generated =
        generatePasswordResetToken(
          now
        );

      const tokenId = uuidv4();

      await createPasswordResetToken(
        {
          id: tokenId,

          userId: user.id,

          tokenHash:
            generated.tokenHash,

          expiresAt:
            generated.expiresAt
        },
        client
      );

      await insertAuditLog(
        {
          id: uuidv4(),

          userId: user.id,

          eventType:
            "PASSWORD_RESET_REQUEST_CREATED",

          metadata: {
            locale: params.locale,
            role: role.role
          }
        },
        client
      );

      return {
        userId: user.id,
        tokenId,

        recipientEmail:
          user.email,

        recipientName:
          user.username,

        rawToken:
          generated.rawToken,

        role: role.role,
        locale: params.locale
      };
    });

  if (delivery) {
    await deliverPasswordResetEmail(
      delivery
    );
  }

  return {
    status: "ACCEPTED",
    message:
      PASSWORD_RESET_ACCEPTED_MESSAGE
  };
}

export async function me(
  userId: string
): Promise<AuthUser> {
  const context =
    await getActiveUserContext(userId);

  if (!context) {
    throw new AuthError(
      "USER_NOT_AVAILABLE"
    );
  }

  return buildAuthUser(
    context.user,
    context.role
  );
}