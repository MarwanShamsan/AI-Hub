import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  updateRefreshToken
} from "../features/auth/session";

const AUTH_API_BASE_URL = (
  (import.meta as any).env
    ?.VITE_AUTH_API_BASE_URL ??
  "http://localhost:4000"
).replace(/\/+$/, "");

const REQUEST_API_BASE_URL = (
  (import.meta as any).env
    ?.VITE_REQUEST_API_BASE_URL ??
  "http://localhost:3003"
).replace(/\/+$/, "");

export type ApiTarget =
  | "auth"
  | "request";

const PUBLIC_AUTH_PATHS =
  new Set<string>([
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/email-verification/verify",
    "/auth/email-verification/resend"
  ]);

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};

let refreshPromise:
  | Promise<boolean>
  | null = null;

export class ApiError extends Error {
  public readonly status: number;

  public readonly reason: string | null;

  public readonly body: unknown;

  public constructor(params: {
    status: number;
    reason: string | null;
    body: unknown;
    message: string;
  }) {
    super(params.message);

    this.name = "ApiError";
    this.status = params.status;
    this.reason = params.reason;
    this.body = params.body;

    Object.setPrototypeOf(
      this,
      new.target.prototype
    );
  }
}

export function isApiError(
  error: unknown
): error is ApiError {
  return error instanceof ApiError;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function baseUrlFor(
  target: ApiTarget
): string {
  return target === "auth"
    ? AUTH_API_BASE_URL
    : REQUEST_API_BASE_URL;
}

function isPublicAuthRequest(
  target: ApiTarget,
  path: string
): boolean {
  return (
    target === "auth" &&
    PUBLIC_AUTH_PATHS.has(path)
  );
}

async function readResponseBody(
  response: Response
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {
      message: text
    };
  }
}

function extractReason(
  body: unknown
): string | null {
  if (
    isRecord(body) &&
    typeof body.reason === "string"
  ) {
    return body.reason;
  }

  return null;
}

function extractMessage(
  body: unknown,
  status: number
): string {
  if (isRecord(body)) {
    if (
      typeof body.message === "string"
    ) {
      return body.message;
    }

    if (
      typeof body.reason === "string"
    ) {
      return body.reason;
    }

    if (
      typeof body.error === "string"
    ) {
      return body.error;
    }
  }

  return `HTTP_${status}`;
}

async function performRefresh():
  Promise<boolean> {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    clearSession();
    return false;
  }

  try {
    const response = await fetch(
      `${AUTH_API_BASE_URL}/auth/refresh`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          refresh_token: refreshToken
        })
      }
    );

    const body =
      await readResponseBody(response);

    if (
      !response.ok ||
      !isRecord(body) ||
      typeof body.access_token !==
        "string" ||
      typeof body.refresh_token !==
        "string"
    ) {
      clearSession();
      return false;
    }

    const tokens =
      body as RefreshResponse;

    updateAccessToken(
      tokens.access_token
    );

    updateRefreshToken(
      tokens.refresh_token
    );

    return true;
  } catch {
    clearSession();
    return false;
  }
}

async function refreshAccessToken():
  Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    performRefresh().finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiRequest(
  target: ApiTarget,
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<Response> {
  const headers =
    new Headers(init.headers);

  const accessToken =
    getAccessToken();

  if (
    accessToken &&
    !isPublicAuthRequest(
      target,
      path
    )
  ) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }

  const response = await fetch(
    `${baseUrlFor(target)}${path}`,
    {
      ...init,
      headers
    }
  );

  const shouldRefresh =
    response.status === 401 &&
    retry &&
    !isPublicAuthRequest(
      target,
      path
    ) &&
    Boolean(getRefreshToken());

  if (!shouldRefresh) {
    return response;
  }

  const refreshed =
    await refreshAccessToken();

  if (!refreshed) {
    return response;
  }

  return apiRequest(
    target,
    path,
    init,
    false
  );
}

export async function apiJson<T>(
  target: ApiTarget,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response =
    await apiRequest(
      target,
      path,
      init
    );

  const body =
    await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      reason: extractReason(body),
      body,
      message: extractMessage(
        body,
        response.status
      )
    });
  }

  return body as T;
}