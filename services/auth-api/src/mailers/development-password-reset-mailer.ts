import { env } from "../config/env";
import type {
  PasswordResetMailer,
  SendPasswordResetEmailInput
} from "./password-reset-mailer";
import {
  renderPasswordResetTemplate
} from "./password-reset-templates";

export class DevelopmentPasswordResetMailer
  implements PasswordResetMailer {
  public async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput
  ): Promise<void> {
    const rendered =
      renderPasswordResetTemplate({
        recipientName:
          input.recipientName,
        resetUrl: input.resetUrl,
        locale: input.locale,
        expiresInMinutes:
          env.passwordResetTtlMinutes
      });

    console.info(
      "PASSWORD_RESET_EMAIL_DEVELOPMENT",
      {
        to: input.recipientEmail,
        subject: rendered.subject,
        resetUrl: input.resetUrl
      }
    );
  }
}