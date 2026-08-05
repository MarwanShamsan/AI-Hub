import { getAccessToken } from "./storage";

const REQUEST_API_BASE_URL =
  import.meta.env.VITE_REQUEST_API_URL?.trim() || "http://localhost:3003";

function buildApiUrl(service: "request", path: string): string {
  const baseUrl =
    service === "request" ? REQUEST_API_BASE_URL : REQUEST_API_BASE_URL;

  return `${baseUrl}${path}`;
}

export async function apiJson<T>(
  service: "request",
  path: string,
  init?: RequestInit
): Promise<T> {
  const accessToken = getAccessToken();

  const response = await fetch(buildApiUrl(service, path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`
          }
        : {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.reason || data?.message || "REQUEST_FAILED");
  }

  return data as T;
}