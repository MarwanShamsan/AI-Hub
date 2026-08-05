import {
  apiClient
} from "../../lib/apiClient";

import type {
  AuthUser,
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  ResendEmailVerificationInput,
  ResendEmailVerificationResponse,
  VerifyEmailInput,
  VerifyEmailResponse
} from "./types";

export const authApi = {
  login: (
    input: LoginInput
  ): Promise<LoginResponse> =>
    apiClient.authPost<LoginResponse>(
      "/auth/login",
      input
    ),

  register: (
    input: RegisterInput
  ): Promise<RegisterResponse> =>
    apiClient.authPost<RegisterResponse>(
      "/auth/register",
      input
    ),

  me: (): Promise<AuthUser> =>
    apiClient.authGet<AuthUser>(
      "/auth/me"
    ),

  verifyEmail: (
    input: VerifyEmailInput
  ): Promise<VerifyEmailResponse> =>
    apiClient.authPost<VerifyEmailResponse>(
      "/auth/email-verification/verify",
      input
    ),

  resendEmailVerification: (
    input: ResendEmailVerificationInput
  ): Promise<ResendEmailVerificationResponse> =>
    apiClient.authPost<ResendEmailVerificationResponse>(
      "/auth/email-verification/resend",
      input
    )
};

export type RequestPasswordResetInput = {
  email: string;
  locale: "ar" | "en";
};

export type RequestPasswordResetResult = {
  status: "ACCEPTED";
  message: string;
};

export type ConfirmPasswordResetInput = {
  token: string;
  new_password: string;
};

export type ConfirmPasswordResetResult = {
  status: "PASSWORD_RESET";
};

export function requestPasswordReset(
  input: RequestPasswordResetInput
): Promise<RequestPasswordResetResult> {
  return apiClient.authPost<
    RequestPasswordResetResult
  >(
    "/auth/password-reset/request",
    input
  );
}

export function confirmPasswordReset(
  input: ConfirmPasswordResetInput
): Promise<ConfirmPasswordResetResult> {
  return apiClient.authPost<
    ConfirmPasswordResetResult
  >(
    "/auth/password-reset/confirm",
    input
  );
}