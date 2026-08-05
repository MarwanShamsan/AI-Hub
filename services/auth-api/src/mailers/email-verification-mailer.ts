import type { AuthLocale } from "../types/auth";

export type SendVerificationEmailInput = {
  recipientEmail: string;
  recipientName?: string | null;
  verificationUrl: string;
  locale: AuthLocale;
};

export interface EmailVerificationMailer {
  sendVerificationEmail(
    input: SendVerificationEmailInput
  ): Promise<void>;
}