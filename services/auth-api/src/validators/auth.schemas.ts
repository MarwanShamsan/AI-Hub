import { z } from "zod";
import { AuthError } from "../errors/auth.error";
import {
  AUTH_LOCALES,
  AuthReasonCode,
  AuthValidationIssue,
  LoginInput,
  PUBLIC_AUTH_ROLES,
  RefreshInput,
  RegisterInput,
  ResendEmailVerificationInput,
  VerifyEmailInput,
  ConfirmPasswordResetInput,
  RequestPasswordResetInput,
} from "../types/auth";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

const EMAIL_MAX_LENGTH = 320;
const IDENTIFIER_MAX_LENGTH = 320;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const VERIFICATION_TOKEN_MAX_LENGTH = 512;
const REFRESH_TOKEN_MAX_LENGTH = 16_384;
const PASSWORD_RESET_TOKEN_MAX_LENGTH = 512;

const normalizedEmailSchema = z
  .string()
  .trim()
  .min(3)
  .max(EMAIL_MAX_LENGTH)
  .email()
  .transform((value) => value.toLowerCase());

const normalizedUsernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .transform((value) => value.toLowerCase())
  .refine((value) => USERNAME_PATTERN.test(value), {
    message: "INVALID_USERNAME_FORMAT"
  });

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .refine((value) => /[A-Za-z]/.test(value), {
    message: "PASSWORD_REQUIRES_LETTER"
  })
  .refine((value) => /\d/.test(value), {
    message: "PASSWORD_REQUIRES_NUMBER"
  });

const publicRoleSchema = z.enum(PUBLIC_AUTH_ROLES);

const localeSchema = z.enum(AUTH_LOCALES).default("en");

export const registerSchema: z.ZodType<RegisterInput> = z
  .object({
    username: normalizedUsernameSchema,
    email: normalizedEmailSchema,
    password: passwordSchema,
    role: publicRoleSchema,
    locale: localeSchema
  })
  .strict();

export const loginSchema: z.ZodType<LoginInput> = z
  .object({
    identifier: z
      .string()
      .trim()
      .min(3)
      .max(IDENTIFIER_MAX_LENGTH)
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(1)
      .max(PASSWORD_MAX_LENGTH),

    expected_role: publicRoleSchema
  })
  .strict();

export const refreshSchema: z.ZodType<RefreshInput> = z
  .object({
    refresh_token: z
      .string()
      .trim()
      .min(1)
      .max(REFRESH_TOKEN_MAX_LENGTH)
  })
  .strict();

export const verifyEmailSchema: z.ZodType<VerifyEmailInput> = z
  .object({
    token: z
      .string()
      .trim()
      .min(32)
      .max(VERIFICATION_TOKEN_MAX_LENGTH)
  })
  .strict();

export const resendEmailVerificationSchema: z.ZodType<
  ResendEmailVerificationInput
> = z
  .object({
    email: normalizedEmailSchema,
    locale: localeSchema
  })
  .strict();

function toValidationIssues(
  error: z.ZodError
): AuthValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    code: issue.code
  }));
}

export const requestPasswordResetSchema:
  z.ZodType<RequestPasswordResetInput> =
  z
    .object({
      email: normalizedEmailSchema,
      locale: localeSchema
    })
    .strict();

export const confirmPasswordResetSchema:
  z.ZodType<ConfirmPasswordResetInput> =
  z
    .object({
      token: z
        .string()
        .trim()
        .min(32)
        .max(
          PASSWORD_RESET_TOKEN_MAX_LENGTH
        ),

      new_password: passwordSchema
    })
    .strict();

function parseSchema<T>(
  schema: z.ZodType<T>,
  input: unknown,
  reason: AuthReasonCode
): T {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  throw new AuthError(reason, {
    validationIssues: toValidationIssues(result.error)
  });
}

export function parseRegisterInput(input: unknown): RegisterInput {
  const result = registerSchema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  const hasPasswordIssue = result.error.issues.some(
    (issue) => issue.path[0] === "password"
  );

  throw new AuthError(
    hasPasswordIssue
      ? "PASSWORD_POLICY_FAILED"
      : "INVALID_REGISTRATION_PAYLOAD",
    {
      validationIssues: toValidationIssues(result.error)
    }
  );
}

export function parseLoginInput(input: unknown): LoginInput {
  /*
   * Login validation intentionally returns INVALID_CREDENTIALS.
   * It does not reveal whether the identifier, password, or expected role
   * was the malformed field.
   */
  return parseSchema(
    loginSchema,
    input,
    "INVALID_CREDENTIALS"
  );
}

export function parseRefreshInput(input: unknown): RefreshInput {
  return parseSchema(
    refreshSchema,
    input,
    "INVALID_REFRESH_TOKEN"
  );
}

export function parseVerifyEmailInput(
  input: unknown
): VerifyEmailInput {
  return parseSchema(
    verifyEmailSchema,
    input,
    "EMAIL_VERIFICATION_TOKEN_INVALID"
  );
}

export function parseResendEmailVerificationInput(
  input: unknown
): ResendEmailVerificationInput {
  /*
   * The resend endpoint will still return a generic ACCEPTED response for
   * eligible, missing, or already-verified accounts.
   *
   * Structurally malformed HTTP payloads remain normal request failures.
   */
  return parseSchema(
    resendEmailVerificationSchema,
    input,
    "REQUEST_FAILED"
  );
}

export function parseRequestPasswordResetInput(
  input: unknown
): RequestPasswordResetInput {
  return parseSchema(
    requestPasswordResetSchema,
    input,
    "REQUEST_FAILED"
  );
}

export function parseConfirmPasswordResetInput(
  input: unknown
): ConfirmPasswordResetInput {
  const result =
    confirmPasswordResetSchema.safeParse(
      input
    );

  if (result.success) {
    return result.data;
  }

  const hasPasswordIssue =
    result.error.issues.some(
      (issue) =>
        issue.path[0] ===
        "new_password"
    );

  throw new AuthError(
    hasPasswordIssue
      ? "PASSWORD_POLICY_FAILED"
      : "PASSWORD_RESET_TOKEN_INVALID",
    {
      validationIssues:
        toValidationIssues(
          result.error
        )
    }
  );
}