import {
  AuthReasonCode,
  AuthRejectedResponse,
  AuthValidationIssue
} from "../types/auth";

const DEFAULT_STATUS_BY_REASON: Readonly<
  Record<AuthReasonCode, number>
> = {
  EMAIL_NOT_VERIFIED: 403,
  EMAIL_ALREADY_VERIFIED: 409,
  EMAIL_VERIFICATION_TOKEN_INVALID: 400,
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 410,
  EMAIL_VERIFICATION_TOKEN_CONSUMED: 409,
  EMAIL_VERIFICATION_RESEND_RATE_LIMITED: 429,
    
  PASSWORD_RESET_TOKEN_INVALID: 400,
  PASSWORD_RESET_TOKEN_EXPIRED: 410,
  PASSWORD_RESET_TOKEN_CONSUMED: 409,
  PASSWORD_RESET_REQUEST_RATE_LIMITED: 429,
  INVALID_CREDENTIALS: 401,
  ROLE_MISMATCH: 403,

  USERNAME_ALREADY_EXISTS: 409,
  EMAIL_ALREADY_EXISTS: 409,
  INVALID_REGISTRATION_PAYLOAD: 400,
  PASSWORD_POLICY_FAILED: 400,

  INVALID_REFRESH_TOKEN: 401,
  REFRESH_TOKEN_EXPIRED: 401,
  REFRESH_TOKEN_REVOKED: 401,

  UNAUTHORIZED: 401,
  USER_NOT_AVAILABLE: 403,
  REQUEST_FAILED: 400
};

export type AuthErrorOptions = {
  statusCode?: number;
  validationIssues?: AuthValidationIssue[];
  auditMetadata?: Record<string, unknown>;
};

export class AuthError extends Error {
  public readonly reason: AuthReasonCode;

  public readonly statusCode: number;

  /**
   * Internal validation details.
   *
   * These details may be used by tests and structured logs, but they must not
   * be returned directly to the public client.
   */
  public readonly validationIssues: readonly AuthValidationIssue[];

  /**
   * Safe structured metadata intended for audit logging.
   *
   * Passwords, raw refresh tokens, and raw email-verification tokens must
   * never be placed in this object.
   */
  public readonly auditMetadata: Readonly<Record<string, unknown>>;

  public constructor(
    reason: AuthReasonCode,
    options: AuthErrorOptions = {}
  ) {
    super(reason);

    this.name = "AuthError";
    this.reason = reason;
    this.statusCode =
      options.statusCode ?? DEFAULT_STATUS_BY_REASON[reason];
    this.validationIssues = options.validationIssues ?? [];
    this.auditMetadata = options.auditMetadata ?? {};

    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toPublicResponse(): AuthRejectedResponse {
    return {
      status: "REJECTED",
      reason: this.reason
    };
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function asAuthError(error: unknown): AuthError {
  if (isAuthError(error)) {
    return error;
  }

  return new AuthError("REQUEST_FAILED", {
    statusCode: 500
  });
}
