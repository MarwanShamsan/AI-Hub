import { apiClient } from "../../lib/apiClient";

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    tenant_id: string;
  };
};

export const authApi = {
  login: (input: { email: string; password: string }) =>
    apiClient.authPost<AuthResponse>("/auth/login", input),

  register: (input: {
    email: string;
    password: string;
    role: "client" | "supplier";
  }) => apiClient.authPost<AuthResponse>("/auth/register", input),

  me: () =>
    apiClient.authGet("/auth/me")
};