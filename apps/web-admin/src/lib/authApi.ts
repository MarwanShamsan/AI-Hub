const AUTH_API_BASE_URL =
  import.meta.env.VITE_AUTH_API_URL?.trim() || "http://localhost:4000";

export type AdminAuthResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    tenant_id: string;
    role?: string;
  };
};

export type AdminMeResponse = {
  id: string;
  email: string;
  tenant_id: string;
  role?: string;
};

async function readJsonSafe(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const authApi = {
  async login(input: { email: string; password: string }) {
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    const data = await readJsonSafe(response);

    if (!response.ok) {
      throw new Error(data?.reason || "LOGIN_FAILED");
    }

    return data as AdminAuthResponse;
  },

  async me(accessToken: string) {
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = await readJsonSafe(response);

    if (!response.ok) {
      throw new Error(data?.reason || "UNAUTHORIZED");
    }

    return data as AdminMeResponse;
  }
};