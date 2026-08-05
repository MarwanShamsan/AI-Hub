import { env } from "../config/env";
import {
  EmailVerificationMailer,
  SendVerificationEmailInput
} from "./email-verification-mailer";
import { renderEmailVerificationTemplate } from "./email-verification-templates";

export class DevelopmentEmailVerificationMailer
  implements EmailVerificationMailer
{
  public async sendVerificationEmail(
    input: SendVerificationEmailInput
  ): Promise<void> {
    const template = renderEmailVerificationTemplate({
      recipientName: input.recipientName,
      verificationUrl: input.verificationUrl,
      locale: input.locale,
      expiresInMinutes: env.emailVerificationTtlMinutes
    });

    /*
     * Development-only behavior.
     *
     * The verification URL contains the raw token and must never be printed
     * by the production SMTP provider.
     */
    console.info("AUTH_DEVELOPMENT_VERIFICATION_EMAIL", {
      recipientEmail: input.recipientEmail,
      locale: input.locale,
      subject: template.subject,
      verificationUrl: input.verificationUrl
    });
  }
}