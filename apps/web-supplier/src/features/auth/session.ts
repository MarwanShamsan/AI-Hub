export type AuthRole =
  | "client"
  | "supplier"
  | "agent6"
  | "ops"
  | "admin";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  role: "supplier";
  tenant_id: string;
  agent_id: number | null;
  email_verified_at: string;
};

const ACCESS_TOKEN_KEY =
  "supplier_access_token";

const REFRESH_TOKEN_KEY =
  "supplier_refresh_token";

const USER_KEY =
  "supplier_session_user";

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isSessionUser(
  value: unknown
): value is SessionUser {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.username === "string" &&
    typeof value.email === "string" &&
    value.role === "supplier" &&
    typeof value.tenant_id === "string" &&
    (
      value.agent_id === null ||
      typeof value.agent_id === "number"
    ) &&
    typeof value.email_verified_at ===
      "string"
  );
}

export function getAccessToken():
  string | null {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY
  );
}

export function getRefreshToken():
  string | null {
  return localStorage.getItem(
    REFRESH_TOKEN_KEY
  );
}

export function getSessionUser():
  SessionUser | null {
  const raw =
    localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      raw
    ) as unknown;

    if (!isSessionUser(parsed)) {
      clearSession();
      return null;
    }

    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(input: {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}): void {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    input.accessToken
  );

  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    input.refreshToken
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(input.user)
  );
}

export function updateAccessToken(
  accessToken: string
): void {
  localStorage.setItem(
    ACCESS_TOKEN_KEY,
    accessToken
  );
}

export function updateRefreshToken(
  refreshToken: string
): void {
  localStorage.setItem(
    REFRESH_TOKEN_KEY,
    refreshToken
  );
}

export function clearSession(): void {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  localStorage.removeItem(USER_KEY);
}