import {
  clearSessionStorage,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken
} from "./storage";

const AUTH_API_URL = (
  import.meta.env.VITE_AUTH_API_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

const COMMAND_API_URL = (
  import.meta.env.VITE_COMMAND_API_URL ||
  "http://localhost:3001"
).replace(/\/+$/, "");

const QUERY_API_URL = (
  import.meta.env.VITE_QUERY_API_URL ||
  "http://localhost:3002"
).replace(/\/+$/, "");

const REQUEST_API_URL = (
  import.meta.env.VITE_REQUEST_API_URL ||
  "http://localhost:3003"
).replace(/\/+$/, "");

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE";

type RequestOptions = {
  retry?: boolean;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};

type ApiErrorOptions = {
  status: number;
  reason: string | null;
  body: unknown;
};

const UNAUTHENTICATED_AUTH_PATHS =
  new Set<string>([
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/email-verification/verify",
    "/auth/email-verification/resend"
  ]);

let refreshPromise:
  | Promise<string | null>
  | null = null;

export class ApiError extends Error {
  public readonly status: number;

  public readonly reason: string | null;

  public readonly body: unknown;

  public constructor(
    message: string,
    options: ApiErrorOptions
  ) {
    super(message);

    this.name = "ApiError";
    this.status = options.status;
    this.reason = options.reason;
    this.body = options.body;

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

function isUnauthenticatedAuthPath(
  path: string
): boolean {
  return UNAUTHENTICATED_AUTH_PATHS.has(
    path
  );
}

function shouldAttachAccessToken(
  path: string
): boolean {
  return !isUnauthenticatedAuthPath(path);
}

function extractErrorReason(
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

function extractErrorMessage(
  body: unknown,
  status: number
): string {
  if (isRecord(body)) {
    if (typeof body.message === "string") {
      return body.message;
    }

    if (typeof body.error === "string") {
      return body.error;
    }

    if (typeof body.reason === "string") {
      return body.reason;
    }
  }

  return `HTTP_${status}`;
}

async function readResponseBody(
  response: Response
): Promise<unknown> {
  const text = await response.text();

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

async function performRefresh():
  Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      `${AUTH_API_URL}/auth/refresh`,
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

    if (!response.ok) {
      throw new ApiError(
        extractErrorMessage(
          body,
          response.status
        ),
        {
          status: response.status,
          reason:
            extractErrorReason(body),
          body
        }
      );
    }

    if (
      !isRecord(body) ||
      typeof body.access_token !==
        "string" ||
      typeof body.refresh_token !==
        "string"
    ) {
      throw new Error(
        "INVALID_REFRESH_RESPONSE"
      );
    }

    const data =
      body as RefreshResponse;

    setAccessToken(data.access_token);
    setRefreshToken(
      data.refresh_token
    );

    return data.access_token;
  } catch {
    clearSessionStorage();
    return null;
  }
}

async function refreshAccessToken():
  Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    performRefresh().finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function request<T>(
  baseUrl: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers();

  if (body !== undefined) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (
    token &&
    shouldAttachAccessToken(path)
  ) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${baseUrl}${path}`,
    {
      method,
      headers,

      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined
    }
  );

  const shouldTryRefresh =
    response.status === 401 &&
    !options.retry &&
    !isUnauthenticatedAuthPath(path) &&
    Boolean(getRefreshToken());

  if (shouldTryRefresh) {
    const newAccessToken =
      await refreshAccessToken();

    if (!newAccessToken) {
      clearSessionStorage();

      if (
        typeof window !== "undefined"
      ) {
        window.location.assign("/");
      }

      throw new ApiError(
        "SESSION_EXPIRED",
        {
          status: 401,
          reason: "UNAUTHORIZED",
          body: null
        }
      );
    }

    return request<T>(
      baseUrl,
      method,
      path,
      body,
      {
        retry: true
      }
    );
  }

  const responseBody =
    await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(
        responseBody,
        response.status
      ),
      {
        status: response.status,
        reason:
          extractErrorReason(
            responseBody
          ),
        body: responseBody
      }
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return responseBody as T;
}

export const apiClient = {
  authGet: <T>(path: string) =>
    request<T>(
      AUTH_API_URL,
      "GET",
      path
    ),

  authPost: <T>(
    path: string,
    body?: unknown
  ) =>
    request<T>(
      AUTH_API_URL,
      "POST",
      path,
      body
    ),

  commandGet: <T>(path: string) =>
    request<T>(
      COMMAND_API_URL,
      "GET",
      path
    ),

  commandPost: <T>(
    path: string,
    body?: unknown
  ) =>
    request<T>(
      COMMAND_API_URL,
      "POST",
      path,
      body
    ),

  commandPut: <T>(
    path: string,
    body?: unknown
  ) =>
    request<T>(
      COMMAND_API_URL,
      "PUT",
      path,
      body
    ),

  commandDelete: <T>(
    path: string
  ) =>
    request<T>(
      COMMAND_API_URL,
      "DELETE",
      path
    ),

  queryGet: <T>(path: string) =>
    request<T>(
      QUERY_API_URL,
      "GET",
      path
    ),

  queryPost: <T>(
    path: string,
    body?: unknown
  ) =>
    request<T>(
      QUERY_API_URL,
      "POST",
      path,
      body
    ),

  requestGet: <T>(path: string) =>
    request<T>(
      REQUEST_API_URL,
      "GET",
      path
    ),

  requestPost: <T>(
    path: string,
    body?: unknown
  ) =>
    request<T>(
      REQUEST_API_URL,
      "POST",
      path,
      body
    ),

  requestPut: <T>(
    path: string,
    body?: unknown
  ) =>
    request<T>(
      REQUEST_API_URL,
      "PUT",
      path,
      body
    ),

  requestDelete: <T>(
    path: string
  ) =>
    request<T>(
      REQUEST_API_URL,
      "DELETE",
      path
    )
};
