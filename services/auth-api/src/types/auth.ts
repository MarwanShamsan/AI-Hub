export const PUBLIC_AUTH_ROLES = ["client", "supplier"] as const;

export type PublicAuthRole = (typeof PUBLIC_AUTH_ROLES)[number];

export const AUTH_ROLES = [
  "client",
  "supplier",
  "agent6",
  "ops",
  "admin"
] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export const AUTH_LOCALES = ["ar", "en"] as const;

export type AuthLocale = (typeof AUTH_LOCALES)[number];

export const AUTH_REASON_CODES = [
  "EMAIL_NOT_VERIFIED",
  "EMAIL_ALREADY_VERIFIED",
  "EMAIL_VERIFICATION_TOKEN_INVALID",
  "EMAIL_VERIFICATION_TOKEN_EXPIRED",
  "EMAIL_VERIFICATION_TOKEN_CONSUMED",
  "EMAIL_VERIFICATION_RESEND_RATE_LIMITED",
  "PASSWORD_RESET_TOKEN_INVALID",
  "PASSWORD_RESET_TOKEN_EXPIRED",
  "PASSWORD_RESET_TOKEN_CONSUMED",
  "PASSWORD_RESET_REQUEST_RATE_LIMITED",
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

export type AuthReasonCode = (typeof AUTH_REASON_CODES)[number];

export type AuthActorType = "USER";

export type AuthUser = {
  sub: string;
  actor_type: AuthActorType;
  tenant_id: string;
  role: AuthRole;
  agent_id: number | null;
  username: string;
  email: string;
  email_verified_at: string | null;
};

export type AuthTokenPair = {
  access_token: string;
  refresh_token: string;
};

export type LoginResult = AuthTokenPair & {
  user: AuthUser;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  role: PublicAuthRole;
  locale: AuthLocale;
};

export type LoginInput = {
  identifier: string;
  password: string;
  expected_role: PublicAuthRole;
};

export type RefreshInput = {
  refresh_token: string;
};

export type VerifyEmailInput = {
  token: string;
};

export type ResendEmailVerificationInput = {
  email: string;
  locale: AuthLocale;
};

export type RequestPasswordResetInput = {
  email: string;
  locale: AuthLocale;
};

export type ConfirmPasswordResetInput = {
  token: string;
  new_password: string;
};

export type RegisterResult = {
  status: "PENDING_EMAIL_VERIFICATION";
  user: {
    id: string;
    username: string;
    email: string;
    role: PublicAuthRole;
  };
};

export type VerifyEmailResult = {
  status: "VERIFIED";
  user: {
    id: string;
    username: string;
    email: string;
    role: PublicAuthRole;
    email_verified_at: string;
  };
};

export type ResendEmailVerificationResult = {
  status: "ACCEPTED";
  message: string;
};

export type RequestPasswordResetResult = {
  status: "ACCEPTED";
  message: string;
};

export type ConfirmPasswordResetResult = {
  status: "PASSWORD_RESET";
};

export type AuthRejectedResponse = {
  status: "REJECTED";
  reason: AuthReasonCode;
};

export type AuthAcceptedResponse = {
  status: "ACCEPTED";
  message: string;
};

export type RequestContext = {
  userAgent: string | null;
  ipAddress: string | null;
};

export type RequestPasswordResetServiceInput =
  RequestPasswordResetInput &
  RequestContext;

export type ConfirmPasswordResetServiceInput =
  ConfirmPasswordResetInput &
  RequestContext;
  
export type RegisterServiceInput = RegisterInput & RequestContext;

export type LoginServiceInput = LoginInput & RequestContext;

export type RefreshServiceInput = {
  refreshToken: string;
} & RequestContext;

export type ResendEmailVerificationServiceInput =
  ResendEmailVerificationInput & RequestContext;

export type AuthValidationIssue = {
  path: string;
  code: string;
};
