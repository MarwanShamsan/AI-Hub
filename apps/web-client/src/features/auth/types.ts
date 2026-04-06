export type AuthRole = "client" | "supplier";

export type AuthUser = {
  sub: string;
  actor_type: "USER";
  tenant_id: string;
  role: AuthRole;
  agent_id: number | null;
  email: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterClientInput = {
  email: string;
  password: string;
  role: "client";
};