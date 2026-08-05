import {
  isApiError
} from "../../lib/apiClient";
import type {
  AuthReasonCode
} from "./types";

const AUTH_REASON_MESSAGE_KEYS:
  Readonly<
    Partial<
      Record<AuthReasonCode, string>
    >
  > = {
  EMAIL_NOT_VERIFIED:
    "auth.errors.emailNotVerified",

  EMAIL_ALREADY_VERIFIED:
    "auth.errors.emailAlreadyVerified",

  EMAIL_VERIFICATION_TOKEN_INVALID:
    "auth.errors.verificationTokenInvalid",

  EMAIL_VERIFICATION_TOKEN_EXPIRED:
    "auth.errors.verificationTokenExpired",

  EMAIL_VERIFICATION_TOKEN_CONSUMED:
    "auth.errors.verificationTokenConsumed",

  EMAIL_VERIFICATION_RESEND_RATE_LIMITED:
    "auth.errors.resendRateLimited",

  INVALID_CREDENTIALS:
    "auth.errors.invalidCredentials",

  ROLE_MISMATCH:
    "auth.errors.roleMismatch",

  USERNAME_ALREADY_EXISTS:
    "auth.errors.usernameAlreadyExists",

  EMAIL_ALREADY_EXISTS:
    "auth.errors.emailAlreadyExists",

  INVALID_REGISTRATION_PAYLOAD:
    "auth.errors.invalidRegistrationPayload",

  PASSWORD_POLICY_FAILED:
    "auth.errors.passwordPolicyFailed",

  INVALID_REFRESH_TOKEN:
    "auth.errors.sessionExpired",

  REFRESH_TOKEN_EXPIRED:
    "auth.errors.sessionExpired",

  REFRESH_TOKEN_REVOKED:
    "auth.errors.sessionExpired",

  UNAUTHORIZED:
    "auth.errors.unauthorized",

  USER_NOT_AVAILABLE:
    "auth.errors.userNotAvailable",

  REQUEST_FAILED:
    "auth.errors.requestFailed"
};

function isKnownAuthReason(
  value: string
): value is AuthReasonCode {
  return value in
    AUTH_REASON_MESSAGE_KEYS;
}

export function getAuthReasonMessageKey(
  reason: string | null
): string | null {
  if (
    !reason ||
    !isKnownAuthReason(reason)
  ) {
    return null;
  }

  return (
    AUTH_REASON_MESSAGE_KEYS[
      reason
    ] ?? null
  );
}

export function resolveAuthErrorMessage(
  error: unknown,
  translate: (
    key: string
  ) => string,
  fallbackKey: string
): string {
  if (isApiError(error)) {
    const messageKey =
      getAuthReasonMessageKey(
        error.reason
      );

    if (messageKey) {
      return translate(messageKey);
    }
  }

  return translate(fallbackKey);
}