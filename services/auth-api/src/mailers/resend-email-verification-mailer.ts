import { env } from "../config/env";

import type {
  EmailVerificationMailer,
  SendVerificationEmailInput
} from "./email-verification-mailer";

import {
  renderEmailVerificationTemplate
} from "./email-verification-templates";

import {
  createResendIdempotencyKey,
  ResendHttpClient
} from "./resend-http-client";

export class ResendEmailVerificationMailer
  implements EmailVerificationMailer {
  private readonly client:
    ResendHttpClient;

  public constructor() {
    const apiKey =
      env.resend.apiKey;

    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is required when EMAIL_PROVIDER=resend"
      );
    }

    this.client =
      new ResendHttpClient(apiKey);
  }

  public async sendVerificationEmail(
    input: SendVerificationEmailInput
  ): Promise<void> {
    const rendered =
      renderEmailVerificationTemplate({
        recipientName:
          input.recipientName,

        verificationUrl:
          input.verificationUrl,

        locale:
          input.locale,

        expiresInMinutes:
          env.emailVerificationTtlMinutes
      });

    await this.client.sendEmail({
      from: env.emailFrom,
      to: input.recipientEmail,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,

      idempotencyKey:
        createResendIdempotencyKey(
          "verification",
          input.recipientEmail,
          input.verificationUrl
        )
    });
  }
}