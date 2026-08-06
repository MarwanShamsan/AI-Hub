import { env } from "../config/env";

import type {
  PasswordResetMailer,
  SendPasswordResetEmailInput
} from "./password-reset-mailer";

import {
  renderPasswordResetTemplate
} from "./password-reset-templates";

import {
  createResendIdempotencyKey,
  ResendHttpClient
} from "./resend-http-client";

export class ResendPasswordResetMailer
  implements PasswordResetMailer {
  private readonly client:
    ResendHttpClient;

  public constructor() {
    if (!env.resend.apiKey) {
      throw new Error(
        "Resend configuration is incomplete"
      );
    }

    this.client =
      new ResendHttpClient(
        env.resend.apiKey
      );
  }

  public async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput
  ): Promise<void> {
    const rendered =
      renderPasswordResetTemplate({
        recipientName:
          input.recipientName,

        resetUrl:
          input.resetUrl,

        locale:
          input.locale,

        expiresInMinutes:
          env.passwordResetTtlMinutes
      });

    await this.client.sendEmail({
      from: env.emailFrom,
      to: input.recipientEmail,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,

      idempotencyKey:
        createResendIdempotencyKey(
          "password-reset",
          input.recipientEmail,
          input.resetUrl
        )
    });
  }
}