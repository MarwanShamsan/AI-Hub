import type {
  AuthLocale
} from "../types/auth";

export type SendPasswordResetEmailInput = {
  recipientEmail: string;
  recipientName?: string | null;
  resetUrl: string;
  locale: AuthLocale;
};

export interface PasswordResetMailer {
  sendPasswordResetEmail(
    input: SendPasswordResetEmailInput
  ): Promise<void>;
}