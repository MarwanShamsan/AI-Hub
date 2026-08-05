export type AuthRole = "client" | "supplier";

export type AuthLocale = "ar" | "en";

export const AUTH_REASON_CODES = [
  "EMAIL_NOT_VERIFIED",
  "EMAIL_ALREADY_VERIFIED",
  "EMAIL_VERIFICATION_TOKEN_INVALID",
  "EMAIL_VERIFICATION_TOKEN_EXPIRED",
  "EMAIL_VERIFICATION_TOKEN_CONSUMED",
  "EMAIL_VERIFICATION_RESEND_RATE_LIMITED",
  "INVALID_CREDENTIALS",
  "ROLE_MISMATCH",
  "USERNAME_ALREADY_EXISTS",
  "EMAIL_ALREADY_EXISTS",
  "INVALID_REGISTRATION_PAYLOAD",
  "PASSWORD_POLICY_FAILED",
  "INVALID_REFRESH_TOKEN",
  "REFRESH_TOKEN_EXPIRED",
  "REFRESH_TOKEN_REVOKED",
  "UNAUTHORIZED",
  "USER_NOT_AVAILABLE",
  "REQUEST_FAILED"
] as const;

export type AuthReasonCode =
  (typeof AUTH_REASON_CODES)[number];

export type AuthUser = {
  sub: string;
  actor_type: "USER";
  tenant_id: string;
  role: AuthRole;
  agent_id: number | null;
  username: string;
  email: string;
  email_verified_at: string | null;
};

export type LoginInput = {
  identifier: string;
  password: string;
  expected_role: AuthRole;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  role: AuthRole;
  locale: AuthLocale;
};

export type RegisterResponse = {
  status: "PENDING_EMAIL_VERIFICATION";
  user: {
    id: string;
    username: string;
    email: string;
    role: AuthRole;
  };
};

export type VerifyEmailInput = {
  token: string;
};

export type VerifyEmailResponse = {
  status: "VERIFIED";
  user: {
    id: string;
    username: string;
    email: string;
    role: AuthRole;
    email_verified_at: string;
  };
};

export type ResendEmailVerificationInput = {
  email: string;
  locale: AuthLocale;
};

export type ResendEmailVerificationResponse = {
  status: "ACCEPTED";
  message: string;
};

export type AuthRejectedResponse = {
  status: "REJECTED";
  reason: AuthReasonCode;
};