import {
  isApiError
} from "../../lib/apiClient";

type Translate = (
  key: string
) => string;

const AUTH_ERROR_KEYS:
  Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS:
    "auth.errors.invalidCredentials",

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

  USER_NOT_AVAILABLE:
    "auth.errors.userNotAvailable",

  UNAUTHORIZED:
    "auth.errors.unauthorized",

  REQUEST_FAILED:
    "auth.errors.requestFailed"
};

export function resolveAuthErrorMessage(
  error: unknown,
  translate: Translate,
  fallbackKey: string
): string {
  const reason =
    isApiError(error)
      ? error.reason
      : error instanceof Error
        ? error.message
        : null;

  if (reason) {
    const messageKey =
      AUTH_ERROR_KEYS[reason];

    if (messageKey) {
      return translate(messageKey);
    }
  }

  return translate(fallbackKey);
}