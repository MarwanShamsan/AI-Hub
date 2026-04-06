import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import {
  createUser,
  createUserRole,
  findPrimaryRoleByUserId,
  findRefreshTokenByHash,
  findUserByEmail,
  findUserById,
  insertAuditLog,
  insertRefreshToken,
  revokeRefreshToken,
  updateLastLoginAt
} from "../repositories/user.repository";
import { comparePassword, hashPassword } from "../utils/password";
import {
  AuthJwtPayload,
  signAccessToken,
  signRefreshToken,
  verifyToken
} from "../utils/jwt";

export type LoginResult = {
  access_token: string;
  refresh_token: string;
  user: AuthJwtPayload & { email: string };
};

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildRefreshExpiry(days = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function buildUserPayload(
  userId: string
): Promise<(AuthJwtPayload & { email: string }) | null> {
  const user = await findUserById(userId);
  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  const role = await findPrimaryRoleByUserId(user.id);
  if (!role) {
    return null;
  }

  return {
    sub: user.id,
    actor_type: "USER",
    tenant_id: user.tenant_id,
    role: role.role,
    agent_id: role.agent_id,
    email: user.email
  };
}

async function issueTokens(params: {
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<LoginResult> {
  const payload = await buildUserPayload(params.userId);
  if (!payload) {
    throw new Error("User role is not configured");
  }

  const accessToken = await signAccessToken(payload);
  const refreshToken = await signRefreshToken(payload);

  await insertRefreshToken({
    id: uuidv4(),
    userId: params.userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: buildRefreshExpiry(),
    userAgent: params.userAgent,
    ipAddress: params.ipAddress
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: payload
  };
}

export async function register(params: {
  email: string;
  password: string;
  role: "client" | "supplier";
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<LoginResult> {
  const normalizedEmail = params.email.trim().toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    await insertAuditLog({
      id: uuidv4(),
      userId: existingUser.id,
      eventType: "REGISTER_FAILED",
      metadata: { email: normalizedEmail, reason: "EMAIL_ALREADY_EXISTS" }
    });
    throw new Error("Email already exists");
  }

  if (!["client", "supplier"].includes(params.role)) {
    throw new Error("Invalid role");
  }

  const userId = uuidv4();
  const passwordHash = await hashPassword(params.password);

  await createUser({
    id: userId,
    email: normalizedEmail,
    passwordHash,
    status: "ACTIVE",
    tenantId: `tenant-${userId}`
  });

  await createUserRole({
    id: uuidv4(),
    userId,
    role: params.role,
    agentId: null
  });

  await updateLastLoginAt(userId);

  await insertAuditLog({
    id: uuidv4(),
    userId,
    eventType: "REGISTER_SUCCESS",
    metadata: { email: normalizedEmail, role: params.role }
  });

  return issueTokens({
    userId,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress
  });
}

export async function login(params: {
  email: string;
  password: string;
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<LoginResult> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user || user.status !== "ACTIVE") {
    await insertAuditLog({
      id: uuidv4(),
      userId: user?.id ?? null,
      eventType: "LOGIN_FAILED",
      metadata: { email: normalizedEmail, reason: "INVALID_USER" }
    });
    throw new Error("Invalid credentials");
  }

  const passwordValid = await comparePassword(params.password, user.password_hash);
  if (!passwordValid) {
    await insertAuditLog({
      id: uuidv4(),
      userId: user.id,
      eventType: "LOGIN_FAILED",
      metadata: { email: normalizedEmail, reason: "INVALID_PASSWORD" }
    });
    throw new Error("Invalid credentials");
  }

  const result = await issueTokens({
    userId: user.id,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress
  });

  await updateLastLoginAt(user.id);

  await insertAuditLog({
    id: uuidv4(),
    userId: user.id,
    eventType: "LOGIN_SUCCESS",
    metadata: { email: normalizedEmail }
  });

  return result;
}

export async function refresh(params: {
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<LoginResult> {
  const stored = await findRefreshTokenByHash(hashToken(params.refreshToken));
  if (!stored) {
    throw new Error("Invalid refresh token");
  }

  if (stored.revoked_at) {
    throw new Error("Refresh token revoked");
  }

  const expiresAt = new Date(stored.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    throw new Error("Refresh token expired");
  }

  const decoded = await verifyToken(params.refreshToken);
  const payload = await buildUserPayload(decoded.sub);
  if (!payload) {
    throw new Error("User is not available");
  }

  await revokeRefreshToken(stored.id);

  const newAccessToken = await signAccessToken(payload);
  const newRefreshToken = await signRefreshToken(payload);

  await insertRefreshToken({
    id: uuidv4(),
    userId: payload.sub,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: buildRefreshExpiry(),
    userAgent: params.userAgent,
    ipAddress: params.ipAddress
  });

  await insertAuditLog({
    id: uuidv4(),
    userId: payload.sub,
    eventType: "REFRESH_SUCCESS",
    metadata: {}
  });

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    user: payload
  };
}

export async function me(
  userId: string
): Promise<AuthJwtPayload & { email: string }> {
  const payload = await buildUserPayload(userId);
  if (!payload) {
    throw new Error("User not found");
  }
  return payload;
}