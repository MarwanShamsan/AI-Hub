import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearSessionStorage
} from "./storage";

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || "http://localhost:4000";

const COMMAND_API_URL =
  import.meta.env.VITE_COMMAND_API_URL || "http://localhost:3001";

const QUERY_API_URL =
  import.meta.env.VITE_QUERY_API_URL || "http://localhost:3002";

const REQUEST_API_URL =
  import.meta.env.VITE_REQUEST_API_URL || "http://localhost:3003";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  retry?: boolean;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};

function isAuthPath(path: string): boolean {
  return path === "/auth/login" || path === "/auth/register" || path === "/auth/refresh";
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) return null;

  try {
    const res = await fetch(`${AUTH_API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });

    if (!res.ok) {
      throw new Error("REFRESH_FAILED");
    }

    const data = (await res.json()) as RefreshResponse;

    if (!data?.access_token || !data?.refresh_token) {
      throw new Error("MISSING_TOKENS");
    }

    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);

    return data.access_token;
  } catch {
    clearSessionStorage();
    return null;
  }
}

async function request<T>(
  baseUrl: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const token = getAccessToken();

const headers: HeadersInit = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !isAuthPath(path)) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const shouldTryRefresh =
    response.status === 401 &&
    !options.retry &&
    !isAuthPath(path) &&
    baseUrl !== AUTH_API_URL;

  if (shouldTryRefresh) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      clearSessionStorage();
      window.location.href = "/";
      throw new Error("Session expired");
    }

    return request<T>(baseUrl, method, path, body, {
      retry: true
    });
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || err?.reason || err?.error || "Request failed");
  }

  return response.json();
}

export const apiClient = {
  authGet: <T>(path: string) =>
    request<T>(AUTH_API_URL, "GET", path),

  authPost: <T>(path: string, body?: unknown) =>
    request<T>(AUTH_API_URL, "POST", path, body),

  commandGet: <T>(path: string) =>
    request<T>(COMMAND_API_URL, "GET", path),

  commandPost: <T>(path: string, body?: unknown) =>
    request<T>(COMMAND_API_URL, "POST", path, body),

  commandPut: <T>(path: string, body?: unknown) =>
    request<T>(COMMAND_API_URL, "PUT", path, body),

  commandDelete: <T>(path: string) =>
    request<T>(COMMAND_API_URL, "DELETE", path),

  queryGet: <T>(path: string) =>
    request<T>(QUERY_API_URL, "GET", path),

  queryPost: <T>(path: string, body?: unknown) =>
    request<T>(QUERY_API_URL, "POST", path, body),

  requestGet: <T>(path: string) =>
    request<T>(REQUEST_API_URL, "GET", path),

  requestPost: <T>(path: string, body?: unknown) =>
    request<T>(REQUEST_API_URL, "POST", path, body),

  requestPut: <T>(path: string, body?: unknown) =>
    request<T>(REQUEST_API_URL, "PUT", path, body),

  requestDelete: <T>(path: string) =>
    request<T>(REQUEST_API_URL, "DELETE", path)
};